(async () => {
    const data = await fetch("https://back.aos-shop.uz");
    console.log(await data.json());
})()

