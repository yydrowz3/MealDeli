import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
    UserRole,
    type MeQuery,
    type MeQueryVariables,
} from "../types/__generated__/graphql.ts";
import { BrowserRouter, Route, Routes } from "react-router";
import NotFound from "../pages/404.tsx";
import Header from "../components/header.tsx";
import Restaurants from "../pages/client/restaurants.tsx";
import SearchPage from "../pages/client/searchPage.tsx";
import CategoryPage from "../pages/client/categoryPage.tsx";
import RestaurantPage from "../pages/client/restaurantPage.tsx";
import ConfirmEmail from "../pages/user/confirm-email.tsx";
import EditProfile from "../pages/user/edit-profile.tsx";
import MyRestaurants from "../pages/owner/my-restaurants.tsx";
import AddRestaurants from "../pages/owner/add-restaurants.tsx";
import MyRestaurant from "../pages/owner/my-restaurant.tsx";
import AddDish from "../pages/owner/add-dish.tsx";
import Order from "../pages/order.tsx";
import Dashboard from "../pages/driver/dashboard.tsx";

const ME_QUERY = gql`
    query me {
        me {
            id
            email
            role
            verified
        }
    }
`;

const commonRoutes = [
    { path: "/confirm", component: <ConfirmEmail /> },
    { path: "/edit-profile", component: <EditProfile /> },
    { path: "/orders/:id", component: <Order /> },
];

const clientRoutes = [
    { path: "/", component: <Restaurants /> },
    { path: "/search", component: <SearchPage /> },
    { path: "/category/:slug", component: <CategoryPage /> },
    { path: "/restaurant/:id", component: <RestaurantPage /> },
];

const restaurantRoutes = [
    { path: "/", component: <MyRestaurants /> },
    { path: "/add-restaurant", component: <AddRestaurants /> },
    { path: "/restaurant/:id", component: <MyRestaurant /> },
    { path: "/restaurant/:restaurantId/add-dish", component: <AddDish /> },
];

const driverRoutes = [{ path: "/", component: <Dashboard /> }];

function LoggedInRouter() {
    const { data, loading, error } = useQuery<MeQuery, MeQueryVariables>(
        ME_QUERY
    );

    return (
        <>
            {!data || loading || error ? (
                <div className="h-screen flex justify-center items-center">
                    <span className="font-medium text-xl tracking-widest">
                        Loading...
                    </span>
                </div>
            ) : (
                <BrowserRouter>
                    <Header />
                    <Routes>
                        {commonRoutes.map((route) => (
                            <Route
                                key={route.path}
                                path={route.path}
                                element={route.component}
                            />
                        ))}
                        {data.me.role === UserRole.Client &&
                            clientRoutes.map((route) => (
                                <Route
                                    key={route.path}
                                    path={route.path}
                                    element={route.component}
                                />
                            ))}

                        {data.me.role === UserRole.Owner &&
                            restaurantRoutes.map((route) => (
                                <Route
                                    key={route.path}
                                    path={route.path}
                                    element={route.component}
                                />
                            ))}

                        {data.me.role === UserRole.Delivery &&
                            driverRoutes.map((route) => (
                                <Route
                                    key={route.path}
                                    path={route.path}
                                    element={route.component}
                                />
                            ))}

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            )}
        </>
    );
}

export default LoggedInRouter;
