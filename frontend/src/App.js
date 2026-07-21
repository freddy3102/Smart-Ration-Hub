import { useState } from "react";

import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";

function App() {

    const [loggedIn, setLoggedIn] = useState(false);

    return (

        <>
            {
                loggedIn ?

                <Dashboard/>

                :

                <Login setLoggedIn={setLoggedIn}/>
            }
        </>

    );

}

export default App;