// ==========================================
// WARD HEATMAP DASHBOARD
// ==========================================

const API_URL = "http://localhost:5000/api/complaints";

let wardData = [];
let filteredData = [];

// ==========================================
// 1. LOAD WARD DATA
// ==========================================
async function loadWardData() {
    try {
        const res = await fetch(`${API_URL}/analytics/ward-stats`);
        wardData = await res.json();
        filteredData = [...wardData];
        
        updateStatistics();
        updateWardTable();
        drawCharts();
    } catch (err) {
        console.error("Error loading ward data:", err);
        alert("Failed to load ward statistics. Please ensure the server is running.");
    }
}

// ==========================================
// 2. UPDATE SUMMARY STATISTICS
// ==========================================
function updateStatistics() {
    const totalWards = filteredData.length;
    let totalComplaints = 0;
    let pendingComplaints = 0;
    let resolvedComplaints = 0;

    filteredData.forEach(ward => {
        totalComplaints += ward.total;
        pendingComplaints += ward.pending;
        resolvedComplaints += ward.resolved;
    });

    document.getElementById("totalWards").textContent = totalWards;
    document.getElementById("totalComplaints").textContent = totalComplaints;
    document.getElementById("pendingComplaints").textContent = pendingComplaints;
    document.getElementById("resolvedComplaints").textContent = resolvedComplaints;
}

// ==========================================
// 3. UPDATE WARD TABLE
// ==========================================
function updateWardTable() {
    const tbody = document.getElementById("wardTableBody");
    tbody.innerHTML = "";

    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    No data available
                </td>
            </tr>
        `;
        return;
    }

    // Find max complaints for heat intensity calculation
    const maxComplaints = Math.max(...filteredData.map(w => w.total));

    filteredData.forEach((ward, index) => {
        const intensity = maxComplaints > 0 ? (ward.total / maxComplaints) * 100 : 0;
        
        // Get top 3 categories
        const categories = Object.entries(ward.categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([cat, count]) => `${cat} (${count})`)
            .join(", ");

        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="font-weight: 600; color: #16a34a;">#${index + 1}</td>
            <td style="font-weight: 500;">${ward.ward}</td>
            <td><strong>${ward.total}</strong></td>
            <td style="color: #dc2626;">${ward.pending}</td>
            <td style="color: #059669;">${ward.resolved}</td>
            <td>
                <div class="heatmap-bar">
                    <div class="heatmap-intensity" style="width: ${intensity}%"></div>
                </div>
            </td>
            <td style="font-size: 0.9em;">${categories || "N/A"}</td>
        `;
        tbody.appendChild(row);
    });
}

// ==========================================
// 4. DRAW CHARTS (GOOGLE CHARTS)
// ==========================================
google.charts.load('current', { 'packages': ['corechart', 'bar'] });
google.charts.setOnLoadCallback(function() {
    loadWardData();
});

function drawCharts() {
    drawWardHeatmapChart();
    drawCategoryDistributionChart();
}

function drawWardHeatmapChart() {
    if (filteredData.length === 0) return;

    const chartElement = document.getElementById('wardHeatmapChart');
    if (!chartElement) return;

    // Prepare data - top 10 wards by total complaints
    const topWards = filteredData.slice(0, 10);
    
    const chartData = [['Ward', 'Pending', 'Resolved', { role: 'annotation' }]];
    
    topWards.forEach(ward => {
        chartData.push([
            ward.ward,
            ward.pending,
            ward.resolved,
            ward.total.toString()
        ]);
    });

    const data = google.visualization.arrayToDataTable(chartData);

    const isDarkMode = document.body.classList.contains("dark");
    const textColor = isDarkMode ? "#f0f0f0" : "#333333";
    const bgColor = isDarkMode ? "#1f2937" : "#ffffff";

    const options = {
        title: 'Top 10 Wards by Complaint Volume',
        titleTextStyle: { color: textColor, fontSize: 16, bold: true },
        backgroundColor: bgColor,
        isStacked: true,
        colors: ['#dc2626', '#059669'],
        hAxis: {
            title: 'Number of Complaints',
            titleTextStyle: { color: textColor },
            textStyle: { color: textColor },
            gridlines: { color: isDarkMode ? '#444' : '#e5e7eb' }
        },
        vAxis: {
            title: 'Ward/Area',
            titleTextStyle: { color: textColor },
            textStyle: { color: textColor, fontSize: 11 }
        },
        legend: { 
            position: 'top',
            textStyle: { color: textColor }
        },
        chartArea: { width: '70%', height: '75%' },
        animation: { duration: 800, easing: 'out', startup: true }
    };

    const chart = new google.visualization.BarChart(chartElement);
    chart.draw(data, options);
}

function drawCategoryDistributionChart() {
    if (filteredData.length === 0) return;

    const chartElement = document.getElementById('categoryDistChart');
    if (!chartElement) return;

    // Aggregate categories across all wards
    const categoryTotals = {};
    
    filteredData.forEach(ward => {
        Object.entries(ward.categories).forEach(([category, count]) => {
            categoryTotals[category] = (categoryTotals[category] || 0) + count;
        });
    });

    // Convert to array for chart
    const chartData = [['Category', 'Count']];
    Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
            chartData.push([category, count]);
        });

    const data = google.visualization.arrayToDataTable(chartData);

    const isDarkMode = document.body.classList.contains("dark");
    const textColor = isDarkMode ? "#f0f0f0" : "#333333";
    const bgColor = isDarkMode ? "#1f2937" : "#ffffff";

    const options = {
        title: 'Complaint Distribution by Category',
        titleTextStyle: { color: textColor, fontSize: 16, bold: true },
        backgroundColor: bgColor,
        pieHole: 0.4,
        colors: ['#dc2626', '#f59e0b', '#16a34a', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'],
        legend: {
            position: 'right',
            textStyle: { color: textColor, fontSize: 11 }
        },
        chartArea: { width: '90%', height: '85%' },
        pieSliceText: 'percentage',
        pieSliceTextStyle: { color: 'white', fontSize: 12 },
        animation: { duration: 800, easing: 'out', startup: true }
    };

    const chart = new google.visualization.PieChart(chartElement);
    chart.draw(data, options);
}

// ==========================================
// 5. FILTER AND SORT
// ==========================================
function applyFilters() {
    const statusFilter = document.getElementById("statusFilter").value;
    const sortBy = document.getElementById("sortBy").value;

    // Filter data
    filteredData = wardData.map(ward => {
        if (statusFilter === "all") {
            return ward;
        } else if (statusFilter === "pending") {
            return {
                ...ward,
                total: ward.pending,
                resolved: 0
            };
        } else if (statusFilter === "resolved") {
            return {
                ...ward,
                total: ward.resolved,
                pending: 0
            };
        }
    }).filter(ward => ward.total > 0);

    // Sort data
    filteredData.sort((a, b) => {
        if (sortBy === "total") {
            return b.total - a.total;
        } else if (sortBy === "pending") {
            return b.pending - a.pending;
        } else if (sortBy === "resolved") {
            return b.resolved - a.resolved;
        }
        return 0;
    });

    updateStatistics();
    updateWardTable();
    drawCharts();
}

// ==========================================
// 6. EVENT LISTENERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Apply saved theme
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
    }

    // Filter change listeners
    document.getElementById("statusFilter").addEventListener("change", applyFilters);
    document.getElementById("sortBy").addEventListener("change", applyFilters);
});

// ==========================================
// 7. THEME TOGGLE (Re-draw charts on theme change)
// ==========================================
const originalToggleTheme = window.toggleTheme;
window.toggleTheme = function() {
    if (originalToggleTheme) originalToggleTheme();
    
    document.body.classList.toggle("dark");
    const currentTheme = document.body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("theme", currentTheme);
    
    // Re-draw charts with new theme colors
    if (typeof drawCharts === 'function') {
        drawCharts();
    }
};
