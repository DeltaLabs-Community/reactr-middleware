import {route,index, type RouteConfig} from "@react-router/dev/routes"

export default [
    index("routes/home.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    route("profile", "routes/profile.tsx"),
    route("product/:id", "routes/products/product.tsx"),
] as RouteConfig;
