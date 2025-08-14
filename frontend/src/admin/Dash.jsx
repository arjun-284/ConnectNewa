import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#9C1322", "#22b573", "#3182ce", "#ffa500", "#999"];

function Dashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(" http://localhost:5000/api/users") // Adjust endpoint if needed
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Stats
  const total = users.length;
  const organizers = users.filter(u => u.role === "organizer").length;
  const contributors = users.filter(u => u.role === "contributor").length;
  const admins = users.filter(u => u.role === "admin").length;

  // Pie chart data
  const pieData = [
    { name: "Organizers", value: organizers },
    { name: "Contributors", value: contributors },
    { name: "Admins", value: admins },
    { name: "Others", value: total - (organizers + contributors + admins) }
  ];

  const lastUsers = [...users].reverse().slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto py-10 px-2">
      <h1 className="text-3xl font-extrabold text-center text-[#9C1322] mb-8">Admin Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center border">
          <span className="text-4xl font-bold text-[#9C1322]">{total}</span>
          <span className="mt-2 text-gray-700 font-semibold">Total Users</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center border">
          <span className="text-4xl font-bold text-green-700">{organizers}</span>
          <span className="mt-2 text-gray-700 font-semibold">Organizers</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center border">
          <span className="text-4xl font-bold text-blue-700">{contributors}</span>
          <span className="mt-2 text-gray-700 font-semibold">Contributors</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center border">
          <span className="text-4xl font-bold text-orange-600">{admins}</span>
          <span className="mt-2 text-gray-700 font-semibold">Admins</span>
        </div>
      </div>

      {/* Role Pie Chart */}
      <div className="bg-white rounded-lg shadow p-6 border mb-8">
        <h2 className="text-xl font-bold mb-4 text-[#9C1322]">User Roles Distribution</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

    
    </div>
  );
}

export default Dashboard;
