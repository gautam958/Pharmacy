# ABC Pharmacy

A small web app for ABC Pharmacy to keep track of medicines and their sales. There is a .NET Core Web API for the backend and an Angular single page application for the frontend. All data is stored in JSON files on the server.

## Features

- List of medicines in a grid showing Name, Brand, Expiry Date, Quantity and Price. Notes are not shown in the grid.
- Row colours:
  - **Red** when the expiry date is less than 30 days away (expired medicines are red too).
  - **Yellow** when there are less than 10 units in stock.
  - If both apply, the row is shown in red.
- Search medicines by name.
- Filter by "Expiring in 30 days" or "Low stock", and sort by any column.
- Paging with 10, 50, 100, 200 or 500 rows per page.
- Add a new medicine in a popup. All fields are validated, and the price can have at most 2 decimal places.
- Add a sale in a popup, either with the "Sell" button on a medicine row or with "Add Sale" on the Sales page (search the medicine there). The sold quantity is taken out of the stock, and the sale is saved in the sales history.
- Dashboard cards on both pages: total medicines, expiring in 30 days, low stock and stock value on Medicines; sales and revenue (today and all time) on Sales. The expiring and low stock cards also work as filters.
- Status tags in the grid (Expiring soon, Expired, Low stock, Out of stock, In stock) and the days left until expiry.
- Built with Angular Material (Inter font, rounded icons) and works on mobile. There is a sidebar menu on desktop; on small screens it opens from the menu button and the tables scroll sideways.
- A spinner shows while data is loading or being saved.
- On the first run the API creates 1000 sample medicines and 250 sample sales, so the screens are not empty.

## Technology

| Part | Used |
|------|------|
| Backend | .NET 10, ASP.NET Core Web API (controllers) |
| Frontend | Angular 22, Angular Material, TypeScript |
| Storage | JSON files (`medicines.json`, `sales.json`) |

## Project structure

```
abc-pharmacy/
├── backend/
│   ├── AbcPharmacy.sln
│   ├── Dockerfile
│   └── AbcPharmacy.Api/
│       ├── Controllers/     MedicinesController, SalesController
│       ├── Services/        MedicineService, SaleService (business logic)
│       ├── Data/            JsonDataStore (reads/writes the json files), SeedData
│       ├── Models/          Medicine, Sale, request and response classes
│       ├── Validation/      MaxDecimalPlaces attribute
│       ├── Program.cs
│       └── appsettings.json
├── frontend/
│   ├── Dockerfile, nginx.conf
│   └── src/app/
│       ├── models/          Medicine, Sale interfaces
│       ├── services/        MedicineService, SaleService (calls the API)
│       ├── pages/
│       │   ├── medicine-list/   summary cards, grid, search, filters, sorting, paging
│       │   └── sales/           summary cards, sales history
│       └── dialogs/
│           ├── add-medicine-dialog/   popup to add a medicine
│           └── sale-dialog/           popup to record a sale
├── k8s/                     Kubernetes manifests for AKS
└── AKS-DEPLOYMENT.md        how to deploy to Azure Kubernetes Service
```

## Core logic

### Storing the data

`JsonDataStore` is registered as a singleton.

- When the API starts, it reads `App_Data/medicines.json` and `App_Data/sales.json` into memory. If the files don't exist yet, it creates the sample data first.
- Every read and write goes through one `lock`, and after every change both files are saved again.
- A file is first written to a `.tmp` file and then moved over the old one, so a crash in the middle of saving doesn't leave a broken file.

### Expiring soon and low stock

The API works out these flags for every medicine it returns, so the Angular app doesn't have to calculate them itself:

- `IsExpiringSoon`: the expiry date is earlier than today + 30 days.
- `IsLowStock`: the quantity is less than 10.
- `IsExpired`: the expiry date is earlier than today.

Both limits come from `appsettings.json`:

```json
"Inventory": {
  "ExpiryWarningDays": 30,
  "LowStockThreshold": 10
}
```

The grid uses these flags to set the row colour.

### Adding a medicine

The request is validated with data annotations. A medicine with the same name, brand and expiry date already exists as the same batch, so it is rejected. The same medicine with a different expiry date is allowed.

### Recording a sale

1. Find the medicine. If it isn't found, the API returns 404.
2. Check that it is not expired, and that enough stock is left. If either check fails, the API returns 400 with a message.
3. Reduce the stock and add a sale record. The medicine name and price are copied into the sale, so the history stays correct later.

All of this happens inside the same lock, so two sales at the same time can't sell more than what is in stock.

## API endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/medicines?search=&filter=&sortBy=&sortDir=&page=&pageSize=` | List medicines. `filter` is `all`, `expiring` or `lowstock`. `pageSize` can be up to 500 |
| GET | `/api/medicines/{id}` | One medicine, including its notes |
| POST | `/api/medicines` | Add a medicine |
| GET | `/api/medicines/summary` | Counts for the dashboard cards (total, expiring, expired, low stock, stock value) |
| GET | `/api/sales?page=&pageSize=` | Sales history, newest first |
| GET | `/api/sales/summary` | Sales count and revenue, today and all time |
| POST | `/api/sales` | Record a sale: `{ "medicineId": 1, "quantity": 2 }` |
| GET | `/health` | Health check, used by the Kubernetes probes |

Sample requests are in `backend/AbcPharmacy.Api/AbcPharmacy.Api.http`. You can run them from Visual Studio, Rider, or the VS Code REST Client extension.

## How to run

### Prerequisites

- .NET SDK 10
- Node.js 24 (or 22.22.3 and later). Angular CLI 22 does not work on older Node versions.

### Backend

```bash
cd backend/AbcPharmacy.Api
dotnet run
```

- The API runs on `http://localhost:5207`. Try http://localhost:5207/api/medicines in the browser to check it.
- The json files are created in `backend/AbcPharmacy.Api/App_Data`. To start again with fresh sample data, stop the API and delete that folder.

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

Open http://localhost:4200.

### Connecting the frontend and backend

- The frontend reads the API url from `src/environments/environment.development.ts` (`http://localhost:5207/api`). If you change the API port, change it there as well.
- The API allows calls from `http://localhost:4200` (`AllowedOrigins` in `appsettings.json`). If the frontend runs on another url, add it to that list.

### Production build

```bash
cd frontend
npm run build      # output in dist/abc-pharmacy-ui
```

Before building for production, set the real API url in `src/environments/environment.ts`.

```bash
cd backend/AbcPharmacy.Api
dotnet publish -c Release -o ../publish
```

### Docker and AKS

Both apps have a `Dockerfile`. The frontend image is built with `--configuration aks`, so it calls the API on `/api` of the same host. On AKS, an ingress sends `/api` to the API and everything else to the web app. The full steps are in [AKS-DEPLOYMENT.md](AKS-DEPLOYMENT.md).
