// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
// import "./App.css";
// import { gql } from "@apollo/client";
import { useReactiveVar } from "@apollo/client/react";
import LoggedInRouter from "./routers/logged-in-router.tsx";
import LoggedOutRouter from "./routers/logged-out-router.tsx";
import { isLoggedInVar } from "./apollo";

// const IS_LOGGED_IN = gql`
//     query isLoggedIn {
//         isLoggedIn @client
//     }
// `;

function App() {
    // const [count, setCount] = useState(0);
    // const {
    //     data: { isLoggedIn },
    // } = useQuery<{ data: { isLoggedIn: boolean } }>(IS_LOGGED_IN);
    const isLoggedIn = useReactiveVar(isLoggedInVar);

    return isLoggedIn ? <LoggedInRouter /> : <LoggedOutRouter />;

    // return (
    //     <>
    //         <div>
    //             <a href="https://vite.dev" target="_blank">
    //                 <img src={viteLogo} className="logo" alt="Vite logo" />
    //             </a>
    //             <a href="https://react.dev" target="_blank">
    //                 <img
    //                     src={reactLogo}
    //                     className="logo react"
    //                     alt="React logo"
    //                 />
    //             </a>
    //         </div>
    //         <h1>Vite + React</h1>
    //         <div className="card">
    //             <button onClick={() => setCount((count) => count + 1)}>
    //                 count is {count}
    //             </button>
    //             <p>
    //                 Edit <code>src/App.tsx</code> and save to test HMR
    //             </p>
    //         </div>
    //         <p className="read-the-docs">
    //             Click on the Vite and React logos to learn more
    //         </p>
    //     </>
    // );
}

export default App;
