import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Register() {

    const navigate = useNavigate();

    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("creator");

    const register = async (e) => {

        e.preventDefault();

        try {

            await API.post("/api/auth/register", {
                full_name,
                email,
                password,
                role
            });

            alert("Registration Successful");

            navigate("/login");

        }
        catch (err) {
            console.log(err.response?.data);
            if (typeof err.response?.data?.detail === "string") {
                alert(err.response.data.detail);
            } else {
                alert(JSON.stringify(err.response?.data, null, 2));
            }
        }

    };

    return (

        <div className="flex justify-center items-center min-h-screen bg-gray-100">

            <form
                onSubmit={register}
                className="bg-white shadow-xl rounded-xl p-8 w-96">

                <h1 className="text-3xl font-bold mb-6 text-center">
                    CreatorIQ Register
                </h1>

                <input
                    className="border w-full p-3 mb-4 rounded"
                    placeholder="Full Name"
                    value={full_name}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                />

                <input
                    type="email"
                    className="border w-full p-3 mb-4 rounded"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    className="border w-full p-3 mb-4 rounded"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <select
                    className="border w-full p-3 mb-4 rounded"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="creator">Creator</option>
                    <option value="agency">Agency</option>
                    <option value="marketing_team">Marketing Team</option>
                    <option value="administrator">Administrator</option>
                </select>

                <button
                    className="bg-green-600 hover:bg-green-700 w-full text-white py-3 rounded">
                    Register
                </button>

            </form>

        </div>

    );

}