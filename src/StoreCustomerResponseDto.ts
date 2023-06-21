import { ApiProperty } from "@nestjs/swagger";

import { UserResponseDto } from "src/api/http/users/dtos/UserResponseDto";
import { StoreResponseDto } from "src/api/http/stores/dtos/StoreResponseDto";

import { StoreCustomerTagsDto } from "./StoreCustomerTagsDto";

export type StoreCustomerQuery = {
	id: number;
	cashbacks: number;
	last_time: Date;
	store_id: number;
	store_name: string;
	photo: string;
	store_status: boolean;
};

export class StoreCustomersResponseDto {
	@ApiProperty({ type: Number })
	id!: number;

	@ApiProperty({ type: UserResponseDto })
	user!: UserResponseDto;

	@ApiProperty({ type: StoreResponseDto })
	store!: StoreResponseDto;

	@ApiProperty({ type: Boolean })
	status!: boolean;

	@ApiProperty({ type: Number })
	cashbacks!: number;

	@ApiProperty({ type: String })
	notes!: string;

	@ApiProperty({ type: StoreCustomerTagsDto, isArray: true })
	tags!: StoreCustomerTagsDto[];

	@ApiProperty({ type: Date, nullable: true })
	last_time?: Date;

	public setId(id: number) {
		this.id = id;
		return this;
	}

	public setUser(user: UserResponseDto) {
		this.user = user;
		return this;
	}

	public setStore(store: StoreResponseDto) {
		this.store = store;
		return this;
	}

	public setCashback(cashback: number) {
		this.cashbacks = cashback;
		return this;
	}

	public setStatus(status: boolean) {
		this.status = status;
		return this;
	}

	public setNotes(notes: string) {
		this.notes = notes;
		return this;
	}

	public setTags(tags: StoreCustomerTagsDto[]) {
		this.tags = tags;
		return this;
	}

	public setLastTime(lastTime: Date) {
		this.last_time = lastTime;
		return this;
	}

	private static instance: StoreCustomersResponseDto | null;

	public static builder() {
		this.instance = new StoreCustomersResponseDto();
		return this.instance;
	}

	public build() {
		return this;
	}
}
