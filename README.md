# Express Food Backend (Intentional Bug Demo)

This is a simple Node.js + Express backend project with:

- `GET /menu` - returns food items
- `POST /order` - creates an order using `itemId` and `quantity`
- `GET /slow` - intentionally slow endpoint to simulate an N+1 query problem

## Intentional Issues Included

1. `/menu` has a null/undefined bug that can throw runtime errors.
2. `/order` intentionally skips request validation.
3. `/slow` intentionally performs an inefficient N+1-style loop.

## Project Structure

```text
.
├── package.json
├── README.md
└── src
    ├── app.js
    ├── server.js
    ├── db
    │   └── fakeDb.js
    └── routes
        ├── menuRoutes.js
        ├── orderRoutes.js
        └── slowRoutes.js
```

## Run the Project

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

3. Server runs at:

   [http://localhost:3000](http://localhost:3000)

## Example Requests

### Get menu

```bash
curl http://localhost:3000/menu
```

### Create order (no validation by design)

```bash
curl -X POST http://localhost:3000/order \
  -H "Content-Type: application/json" \
  -d "{\"itemId\":1,\"quantity\":2}"
```

### Slow endpoint

```bash
curl http://localhost:3000/slow
```
