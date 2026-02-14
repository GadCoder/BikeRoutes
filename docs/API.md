# BikeRoutes API

Base URL: `/api`

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

## Routes
- `GET /api/routes`
- `POST /api/routes`
- `GET /api/routes/{route_id}`
- `PUT /api/routes/{route_id}`
- `DELETE /api/routes/{route_id}`

## Sharing
- `GET /api/routes/share/{token}`
