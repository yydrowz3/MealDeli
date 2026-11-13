import { BrowserRouter, Route, Routes } from "react-router";
import CreateAccount from "../pages/create-account";
import Login from "../pages/login";
import NotFound from "../pages/404.tsx";

function LoggedOutRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route index element={<Login />} />
                <Route path="create-account" element={<CreateAccount />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}
export default LoggedOutRouter;
