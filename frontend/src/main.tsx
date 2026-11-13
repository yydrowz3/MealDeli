import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ApolloProvider } from "@apollo/client/react";
import client from "./apollo";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ApolloProvider client={client}>
            <Toaster />
            <App />
        </ApolloProvider>
    </StrictMode>
);
