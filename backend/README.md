# MealRelay - Legacy Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

The backend is built based on `NestJS`. Please make sure the `Node.js` environment is installed and the Node Version `> 18.0`.

Following the `NestJS` system concept, this project creates mainly the following injectable modules:

- Auth Module
- **User Module**
- **Restaurant Module**
- **Order Module**
- Mail Module
- Payments Module
- Upload Module

The backend utilizes the GraphQL instead traditional API for a more simple but efficient data communication. The `Schema` is automatically generated with `Apollo Server` Tools.

## How to use

Before executing the MealRelay legacy backend, you should create a `.env` configuration file in the backend directory as `./backend/.env`;

You can update and customize your configurations, but before deploying, make sure you included these key and values:

```
DB_HOST=your postgre database host
DB_PORT=your postgre database port
DB_USERNAME=your postgre database username
DB_PASSWORD=your postgre database password
DB_NAME=your postgre database name
PRIVATE_KEY=your private key for jwt sign
MAILGUN_API_KEY=your mailgun api key
MAILGUN_DOMAIN_NAME=your mailgun domain name
SUPABASE_KEY=your supabase key
SUPABSE_URL=your supabase url
```

For running backend server on your local machine, please run the following commands:

```sh
cd ./backend
pnpm install
pnpm run start
```

By default, your backend server will start at `http://localhost:3000`.

This project also opens the GraphQL playground by default, you can visit the url `http://localhost:3000/graphql` for a preview graphql endpoints as well as the document.

If you need to compile into a production mode, please run:

```sh
pnpm run build
```

The output will be saved in `./backend/dist/` directory.

## Testing

This project is tested with `Jest` library. To run the test process, please stay in the root directory of backend, and run the following commands:

- Unit Test:

```sh
pnpm run test
```

- E2E Test:

```sh
pnpm run test:e2e
```

- Test Coverage:

```sh
pnpm run test:cov
```

## Backend Features

### User Model:

- id
- createdAt
- updatedAt
- email
- password
- role (client|owner|delivery)

- Create Account
- Log In
- See Profile
- Edit Profile
- Verify Email

### Restaurant Model

- name
- category
- address
- coverImage

- Edit Restaurant
- Delete Restaurant

- See Categories
- See Restaurants by Category (pagination)
- See Restaurants (pagination)
- See Restaurant

- Create Dish
- Edit Dish
- Delete Dish

### Order Model

- Orders CRUD
- Orders Subscription (Owner, Customer, Delivery)
    - Pending Orders (Owner) (listening: newOrder) (trigger by: createOrder(newOrder))
    - Order Status (Customer, Delivery, Owner) (listening: orderUpdate) (trigger by: editOrder(orderUpdate))
    - Pending Pickup Order (Delivery) (listening: orderUpdate) (trigger by: editOrder(orderUpdate))
- Add driver to order

### Payments Model

- Payments (CRON)

## License

[MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
