export default function StatCard({ title, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3>{title}</h3>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}