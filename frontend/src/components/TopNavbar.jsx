import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/userService";

export default function TopNavbar() {

    const [user,setUser] = useState(null);

    useEffect(()=>{

        loadUser();

    },[]);

    const loadUser = async()=>{

        try{

            const data = await getCurrentUser();

            setUser(data);

        }

        catch{

            setUser(null);

        }

    }

    return(

        <div className="bg-white rounded-xl shadow p-5 flex justify-between">

            <div>

                <h1 className="text-3xl font-bold">

                    Creator Dashboard

                </h1>

                <p className="text-gray-500">

                    {user
                    ? `Welcome, ${user.full_name}`
                    : "Please Login"}

                </p>

            </div>

        </div>

    );

}