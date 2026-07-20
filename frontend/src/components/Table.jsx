import "./Table.css";

const Table = ({ columns, rows }) => (
  <table className="analytics-table">
    <thead>
      <tr>
        {columns.map((col, idx) => (
          <th key={idx}>{col}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, idx) => (
        <tr key={idx}>
          {Object.values(row).map((val, i) => (
            <td key={i}>{val}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export default Table;
