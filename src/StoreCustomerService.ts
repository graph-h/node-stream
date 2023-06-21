import { FindManyOptions } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";

import { FindOptions } from "src/types/FindOptions";
import { Page, RepositoryPager } from "src/lib/pagination";
import { DataFilling } from "src/lib/dataFilling/DataFilling";
import { QrCodeDecrypt } from "src/lib/qrCodeCrypt/qrCodeDecrypt";
import { TagEntity } from "src/infrastructure/modules/tags/TagEntity";
import { StoreEntity } from "src/infrastructure/modules/stores/StoresEntity";
import { TagRepository } from "src/infrastructure/modules/tags/TagRepository";
import { QrCodeEntity } from "src/infrastructure/modules/qrCode/QrCodeEntity";
import { UserRepository } from "src/infrastructure/modules/users/UserRepository";
import { StoreRepository } from "src/infrastructure/modules/stores/StoresRepository";
import { UserBuilder, UserEntity } from "src/infrastructure/modules/users/UserEntity";
import { QrCodeRepository } from "src/infrastructure/modules/qrCode/QrCodeRepository";
import { QrCodeNotFound } from "src/api/http/qrCode/exception/QrCodeNotFoundException";
import { StoreNotFoundException } from "src/api/http/stores/exception/StoreNotFoundException";
import { TransactionEntity } from "src/infrastructure/modules/transactions/TransactionEntity";
import { TransactionRepository } from "src/infrastructure/modules/transactions/TransactionRepository";
import { StoreCustomersEntity } from "src/infrastructure/modules/stores/customers/StoreCustomersEntity";
import { GET_LAST_TRANSACTION_BY_USER } from "src/infrastructure/modules/transactions/queries/transaction";
import { StoreCustomersRepository } from "src/infrastructure/modules/stores/customers/StoreCustomersRepository";
import { QrCodeFailedException } from "src/api/http/qrCode/exception/QrCodeFailedException";
import { UserAlreadyRegisteredException } from "src/api/http/users/exceptions/UserAlreadyRegisteredException";

import { GET_USER_STORES } from "./queries";
import {
	CustomerDashboardResponseDto,
	CustomerDashboardStatusResponseDto,
	StatisticsData,
	StatusStatisticDataDto,
} from "./dtos/CustomerDashboardResponseDto";
import { StoreCustomersDto } from "./dtos/StoreCustomersDto";
import { IStoreCustomersService } from "./IStoreCustomersService";
import { CustomerDashboardDto } from "./dtos/CustomerDashboardDto";
import { StoreCustomerUpdateDto } from "./dtos/StoreCustomerUpdateDto";
import { StoreCustomersNotFound } from "./exception/StoreCustomersNotFoundException";
import { CustomerTransactionsPage, UserCustomerDetails } from "./dtos/UserCustomerDetailsDto";
import { StoreCustomerQuery, StoreCustomersResponseDto } from "./dtos/StoreCustomersResponseDto";
import { StoreResponseDto } from "../dtos/StoreResponseDto";
import { UserResponseDto } from "../../users/dtos/UserResponseDto";

@Injectable()
export class StoreCustomersService implements IStoreCustomersService {
	constructor(
		private readonly repository: StoreCustomersRepository,
		@InjectRepository(UserRepository)
		private readonly userRepository: UserRepository,
		@InjectRepository(StoreEntity)
		private readonly storeRepository: StoreRepository,
		@InjectRepository(QrCodeEntity)
		private readonly qrCodeRepository: QrCodeRepository,
		@InjectRepository(TagEntity)
		private readonly tagsRepository: TagRepository,
		@InjectRepository(TransactionEntity)
		private readonly transactionRepository: TransactionRepository,
		private readonly qrCodeDecrypt: QrCodeDecrypt,
		private readonly fillingData: DataFilling,
	) {}

	async findStore(id: number): Promise<StoreEntity> {
		const store = await this.storeRepository.findOne({ where: { id } });
		if (!store) {
			throw new StoreNotFoundException();
		}
		return store;
	}

	async getStoreCustomerByQrCode(qrCode: number): Promise<StoreCustomersEntity> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const customer = await this.repository.query(
			`SELECT u.first_name,
					u.last_name,
					sc.cashbacks,
					sc.notes
			 FROM store_customers sc
					  LEFT JOIN users u ON sc.user_id = u.id
					  LEFT JOIN qr_codes qr ON qr.user_id = u.id
			 where qr.qr_code = $1`,
			[qrCode],
		);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if (!customer.length) {
			throw new StoreCustomersNotFound();
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return customer;
	}

	async getAll(
		search: string,
		options: FindManyOptions<StoreCustomersEntity>,
	): Promise<Page<StoreCustomersEntity>> {
		if (search) {
			const data = await this.repository
				.createQueryBuilder("sc")
				.select("sc.cashbacks")
				.addSelect("sc.id")
				.addSelect("sc.notes")
				.addSelect("scu.id")
				.addSelect("scu.first_name")
				.addSelect("scu.last_name")
				.addSelect("scs.name")
				.addSelect("sct.name")
				.addSelect("sct.color")
				.leftJoin("sc.user", "scu")
				.leftJoin("sc.store", "scs")
				.leftJoin("sc.tags", "sct")
				.where("scu.first_name ilike :search", { search: `%${search}%` })
				.getMany();
			return RepositoryPager.findAllCustomQuery(data, options);
		}
		const data = await this.repository
			.createQueryBuilder("sc")
			.select("sc.cashbacks")
			.addSelect("sc.id")
			.addSelect("scu.id")
			.addSelect("scu.first_name")
			.addSelect("scu.last_name")
			.addSelect("scs.name")
			.addSelect("sct.name")
			.addSelect("sct.color")
			.leftJoin("sc.user", "scu")
			.leftJoin("sc.store", "scs")
			.leftJoin("sc.tags", "sct")
			.getMany();
		return RepositoryPager.findAllCustomQuery(data, options);
	}

	async getUserStores(
		userId: number,
		options?: FindManyOptions<StoreCustomersEntity>,
	): Promise<Page<StoreCustomersResponseDto>> {
		const data = (await this.repository.query(GET_USER_STORES, [
			userId,
		])) as StoreCustomerQuery[];

		const responseData: StoreCustomersResponseDto[] = [];
		for (let customerWithQuery of data) {
			const customer = StoreCustomersResponseDto.builder()
				.setId(customerWithQuery.id)
				.setCashback(customerWithQuery.cashbacks)
				.setStore({
					id: customerWithQuery.store_id,
					name: customerWithQuery.store_name,
					photo: customerWithQuery.photo,
					status: customerWithQuery.store_status,
				} as StoreResponseDto)
				.setLastTime(customerWithQuery.last_time)
				.build();
			responseData.push(customer);
		}

		return RepositoryPager.findAllCustomQuery<StoreCustomersResponseDto>(responseData, options);
	}

	async getUserInfoAndTransactions(
		userId: number,
		storeId: number | undefined,
		options: FindOptions<TransactionEntity>,
	): Promise<CustomerTransactionsPage> {
		let userDetails: UserCustomerDetails | null = null;
		if (storeId) {
			userDetails = await this.repository.getUserCustomerDetails(userId, storeId);
			options.where = { user: { id: userId }, store: { id: storeId } };
		}

		if (!userDetails || !storeId) {
			const user = (await this.userRepository.findOne({
				where: { id: userId },
			})) as UserEntity;
			const lastTransaction = (await this.transactionRepository.query(
				GET_LAST_TRANSACTION_BY_USER,
				[userId],
			)) as [TransactionEntity];

			userDetails = {
				user: new UserBuilder(user),
				last_purchase_date: lastTransaction[0]?.created_at,
			};

			if (storeId) {
				options = {
					...options,
					where: { user: { id: userId }, store: { id: storeId } },
				};
			} else {
				options = {
					...options,
					relations: { store: true },
					where: { user: { id: userId } },
				};
			}
		}

		const data = await RepositoryPager.findAll<TransactionEntity>(
			this.transactionRepository,
			options,
		);

		return {
			details: userDetails,
			...data,
		};
	}

	async getCustomerCashback(
		storeBranchId: number,
		qrCode: string,
	): Promise<StoreCustomersResponseDto> {
		const customer = await this.getStoreCustomerWithQrCode(storeBranchId, qrCode);
		return StoreCustomersResponseDto.builder()
			.setId(customer.id)
			.setCashback(customer.cashbacks * 100)
			.setUser({
				first_name: customer.user.first_name,
				last_name: customer.user.last_name,
			} as UserResponseDto)
			.build();
	}

	async getStoreCustomerWithQrCode(storeBranchId: number, qrCode: string) {
		const qr_code = this.qrCodeDecrypt.decrypt(qrCode);

		if (!qr_code) {
			throw new QrCodeFailedException();
		}

		const qr = await this.qrCodeRepository.findOne({
			where: {
				qr_code: qr_code.code,
			},
			relations: ["user"],
		});

		if (!qr) {
			throw new QrCodeNotFound();
		}

		const selectOptions = {
			where: {
				user: { id: qr.user.id },
				store: { branches: { id: storeBranchId } },
			},
			relations: ["user", "store"],
		};

		let customer = await this.repository.findOne(selectOptions);

		if (!customer) {
			const store = (await this.storeRepository.findOne({
				where: { branches: { id: storeBranchId } },
			})) as StoreEntity;

			await this.create({ store_id: store.id, user_id: qr.user.id }, true);
			customer = (await this.repository.findOne(selectOptions)) as StoreCustomersEntity;
		}

		return customer;
	}

	async create(dto: StoreCustomersDto, isNew: boolean): Promise<StoreCustomersEntity> {
		if (!isNew) {
			await this.findStore(dto.store_id);
			const sameCustomer = await this.repository.findOne({
				where: { user: { id: dto.user_id }, store: { id: dto.store_id } },
			});

			if (sameCustomer) {
				throw new UserAlreadyRegisteredException();
			}
		}

		return await this.repository.save({
			store: { id: dto.store_id },
			user: { id: dto.user_id },
		});
	}

	async updateCustomer(
		store_customer_id: number,
		updateData: StoreCustomerUpdateDto,
	): Promise<number> {
		const foundStoreCustomer = await this.repository.findOneBy({ id: store_customer_id });
		if (!foundStoreCustomer) {
			throw new StoreCustomersNotFound();
		}

		if (updateData.tags) {
			const foundTags = await Promise.all(
				updateData.tags.map((tag_id) => this.tagsRepository.findOneBy({ id: tag_id })),
			);
			if (foundTags) {
				foundStoreCustomer.tags = [];
				foundTags.forEach((tag) => (tag ? foundStoreCustomer.tags.push(tag) : tag));
			}
		}

		foundStoreCustomer.notes = updateData.note || "";

		await this.repository.save(foundStoreCustomer);
		return store_customer_id;
	}

	async getUserStatisticsStatus(
		details: CustomerDashboardDto,
	): Promise<CustomerDashboardStatusResponseDto> {
		const data = [];
		const monthsDiff = this.fillingData.getMonthDiff(details.from_date, details.to_date);
		let month = details.from_date.getMonth() + 1;
		let year = details.from_date.getFullYear();

		for (let i = 0; i <= monthsDiff; i++) {
			if (month > 12) {
				month = 1;
				year += 1;
			}

			const searchDate = new Date(`${year}-${month}-2`);
			let statistic: Promise<StatusStatisticDataDto>;
			if (details.store_id) {
				statistic = this.userRepository.getActiveUserStatisticsByStoreByMonth(
					searchDate,
					details.store_id,
				);
			} else {
				statistic = this.userRepository.getActiveUserStatisticsByMonth(searchDate);
			}

			data.push(statistic);
			month += 1;
		}

		const response = new CustomerDashboardStatusResponseDto();
		response.data = await Promise.all(data);

		return response;
	}

	async getUserStatisticsNew(
		details: CustomerDashboardDto,
	): Promise<CustomerDashboardResponseDto> {
		const response = new CustomerDashboardResponseDto();

		if (details.store_id) {
			response.data = await this.userRepository.getNewUserJoiningStatisticsByStore(
				details.from_date,
				details.to_date,
				details.store_id,
				details.filter,
			);
		} else {
			response.data = await this.userRepository.getNewUserJoiningStatistics(
				details.from_date,
				details.to_date,
				details.filter,
			);
		}

		response.data = this.fillingData.fillingDataForNewDay<StatisticsData>(
			details.from_date,
			details.to_date,
			response.data,
			{ customer_count: 0, date: "" },
		);
		return response;
	}
}
