import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

import TopNavbar from "../components/TopNavbar";
import StatCard from "../components/StatCard";
import Charts from "../components/Charts";
import PlatformCard from "../components/PlatformCard";
import RecentVideos from "../components/RecentVideos";

import API from "../services/auth";

export default function Dashboard() {

  const [youtube, setYoutube] = useState(null);

  useEffect(() => {

    API.get("/youtube/dashboard")

      .then((res) => {

        console.log(res.data);

        setYoutube(res.data);

      })

      .catch((err) => {

        console.log(err);

      });

  }, []);

  return (

    <DashboardLayout>

      <TopNavbar />

      <div className="grid grid-cols-4 gap-6 mt-8">

        <StatCard
          title="Subscribers"
          value={youtube ? youtube.subscriber_count : "Loading..."}
          color="text-red-600"
        />

        <StatCard
          title="Views"
          value={youtube ? youtube.total_views : "Loading..."}
          color="text-green-600"
        />

        <StatCard
          title="Videos"
          value={youtube ? youtube.video_count : "Loading..."}
          color="text-blue-600"
        />

        <StatCard
          title="Platform"
          value="YouTube"
          color="text-purple-600"
        />

      </div>

      <div className="mt-8">

        <Charts />

      </div>

      <div className="grid grid-cols-5 gap-5 mt-8">

        <PlatformCard platform="YouTube" status={false} />
        <PlatformCard platform="Instagram" status={false} />
        <PlatformCard platform="Facebook" status={false} />
        <PlatformCard platform="LinkedIn" status={false} />
        <PlatformCard platform="X" status={false} />

      </div>

      <div className="mt-8">

        <RecentVideos />

      </div>

    </DashboardLayout>

  );

}