import API from "../services/api";

export default function PlatformCard({ platform, status }) {

  const connect = async () => {

    try {

      if (platform === "YouTube") {

        const res = await API.get("/auth/google/login");

        window.location.href = res.data.auth_url;

      }

      else if (platform === "Facebook" || platform === "Instagram") {

        const res = await API.get("/auth/facebook/login");

        window.location.href = res.data.auth_url;

      }

      else {

        alert(platform + " OAuth coming soon.");

      }

    } catch (err) {

      console.log(err.response?.data);

      alert("Please login first.");

    }

  };

  return (

    <div className="bg-white rounded-xl shadow p-5 text-center">

      <h2 className="text-xl font-bold">
        {platform}
      </h2>

      <p className="my-4">
        {status ? "✅ Connected" : "❌ Not Connected"}
      </p>

      {!status && (
        <button
          onClick={connect}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Connect
        </button>
      )}

    </div>

  );

}