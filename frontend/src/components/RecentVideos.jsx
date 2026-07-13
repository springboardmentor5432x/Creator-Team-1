export default function RecentVideos() {
  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">Recent Videos</h2>

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Title</th>
            <th>Views</th>
            <th>Likes</th>
            <th>Revenue</th>
          </tr>
        </thead>

        <tbody>
          <tr className="border-b">
            <td>React Dashboard Tutorial</td>
            <td>120K</td>
            <td>18K</td>
            <td>$480</td>
          </tr>

          <tr className="border-b">
            <td>Python API Project</td>
            <td>95K</td>
            <td>13K</td>
            <td>$350</td>
          </tr>

          <tr>
            <td>CreatorIQ Demo</td>
            <td>210K</td>
            <td>25K</td>
            <td>$820</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}