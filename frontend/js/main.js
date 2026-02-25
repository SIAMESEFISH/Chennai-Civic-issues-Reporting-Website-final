// ==========================================
// 0. CONFIGURATION
// ==========================================
const API_BASE_URL = "http://localhost:5000/api/complaints";

// ==========================================
// 1. GOOGLE CHARTS INITIALIZATION
// ==========================================
if (typeof google !== 'undefined' && google.charts) {
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(refreshChart);
}

async function refreshChart() {
    if (typeof google === 'undefined' || !google.visualization) {
        console.warn("Google Charts library not loaded yet.");
        return; 
    }
    try {
        const response = await fetch(API_BASE_URL);
        const complaints = await response.json();

        const counts = {};
        complaints.forEach(c => {
            counts[c.category] = (counts[c.category] || 0) + (c.reportCount || 1);
        });

        const chartData = [['Category', 'Total Reports']];
        for (let category in counts) {
            chartData.push([category, counts[category]]);
        }

        const dataTable = google.visualization.arrayToDataTable(chartData);
        const isDarkMode = document.body.classList.contains("dark");
        const textColor = isDarkMode ? "#f0f0f0" : "#333333";

        const options = {
            title: 'Live Civic Issue Statistics',
            titleTextStyle: { color: textColor, fontSize: 18, bold: true },
            legend: { textStyle: { color: textColor } },
            pieSliceTextStyle: { color: '#ffffff' },
            is3D: true,
            backgroundColor: 'transparent',
            chartArea: { width: '90%', height: '80%' },
            animation: { duration: 1000, easing: 'out', startup: true }
        };

        const chartElement = document.getElementById('piechart');
        if (chartElement) {
            const chart = new google.visualization.PieChart(chartElement);
            chart.draw(dataTable, options);
        }
    } catch (err) {
        console.error("Chart error:", err);
    }
}

// ==========================================
// 2. COMPLAINT SUBMISSION
// ==========================================
async function submitComplaint(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("name").value);

    let selectedCategory = document.getElementById("category").value;
    if (selectedCategory === "Other") {
        selectedCategory = document.getElementById("otherCategoryInput").value;
    }

    formData.append("category", selectedCategory);
    formData.append("area", document.getElementById("location").value);
    formData.append("wardNumber", document.getElementById("wardNumber").value || "");
    formData.append("latitude", document.getElementById("latitude").value);
    formData.append("longitude", document.getElementById("longitude").value);
    formData.append("description", document.getElementById("description").value);

    const imageFile = document.getElementById("image").files[0];
    if (imageFile) {
        formData.append("image", imageFile);
    }

    try {
        const res = await fetch(API_BASE_URL, {
            method: "POST",
            body: formData
        });

        const result = await res.json();
        const complaintId = result.complaintId;
        
        // Show success message
        alert(`✅ Complaint Registered Successfully!\n\nYour Complaint ID: ${complaintId}\n\nPlease save this ID for tracking.`);
        
        // Clear the form
        document.querySelector("form").reset();
        
        // Reset map location
        if (typeof initMap === 'function') {
            initMap();
        }
        
        // Reload dashboard to show new complaint
        if (typeof loadDashboard === 'function') {
            loadDashboard();
        }
        if (typeof refreshChart === 'function') {
            refreshChart();
        }

    } catch (err) {
        alert("Submission failed: " + err.message);
    }
}

// ==========================================
// 3. DASHBOARD & TRACKING
// ==========================================
async function loadDashboard() {
    try {
        const res = await fetch(API_BASE_URL);
        const data = await res.json();
        const table = document.getElementById("dashboardTable");
        if(!table) return;

        const currentUserId = localStorage.getItem("userId");

        table.innerHTML = ""; 
        data.forEach(c => {
            const hasReported = currentUserId
                && Array.isArray(c.sameIssueReports)
                && c.sameIssueReports.some((r) => r.userId === currentUserId);

            const reportButton = hasReported
                ? "<button disabled style=\"opacity: 0.6; cursor: not-allowed;\">Reported</button>"
                : `<button onclick="reportSameIssue('${c._id}')">Report Same Issue</button>`;

            table.innerHTML += `
                <tr>
                    <td>${c.complaintId}</td>
                    <td>${c.category}</td>
                    <td>${c.wardNumber || c.area}</td>
                    <td class="status-pending">${c.status || "Pending"}</td>
                    <td>${c.reportCount}</td>
                    <td>
                        ${c.image ? `<img src="http://localhost:5000/uploads/${c.image}" width="70" onclick="openImageModal('http://localhost:5000/uploads/${c.image}', '${c.category} - ${c.area}')" title="Click to view full size">` : "No Image"}
                    </td>
                    <td>
                        ${reportButton}
                    </td>
                </tr>
            `;
        });
    } catch (err) { console.error("Dashboard load error:", err); }
}

async function trackComplaint() {
    const id = document.getElementById("trackId").value;
    if (!id) {
        alert("Please enter Complaint ID");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/track/${id}`);
        if (!res.ok) throw new Error("Invalid ID");
        const data = await res.json();

        const resultDiv = document.getElementById("result");
        const category = data.category ;
        const area = data.area ;

        resultDiv.style.display = "block";
        resultDiv.style.background = "";
        resultDiv.style.color = "";
        resultDiv.innerHTML = `
            <strong>Complaint Status:</strong><br>
            Status: <strong>${data.status || "Pending"}</strong><br>
            Reports: ${data.reportCount || 1}
        `;
    } catch {
        const resultDiv = document.getElementById("result");
        resultDiv.style.display = "block";
        resultDiv.style.background = "#fee2e2";
        resultDiv.style.color = "#dc2626";
        resultDiv.innerHTML = "❌ Invalid Complaint ID. Please check and try again.";
    }
}

async function reportSameIssue(id) {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "Unknown";
    const userEmail = localStorage.getItem("userEmail") || "";

    if (!userId) {
        alert("Please login to report the same issue.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/report-same/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, name: userName, email: userEmail })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Unable to report the same issue.");
            return;
        }

        loadDashboard(); 
        refreshChart(); 
    } catch (err) {
        alert("Failed to report the same issue.");
    }
}

// ==========================================
// 4. THEME & MAP LOGIC
// ==========================================
function toggleTheme() {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
    if (typeof refreshChart === 'function') refreshChart();
}

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("themeToggle");
    if (btn) btn.addEventListener("click", toggleTheme);
    if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

    const reportMapElement = document.getElementById('map');
    if (reportMapElement) initMap();
});

let map, marker;

function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    if (map) {
        map.off();
        map.remove();
        map = null;
    }

    if (mapContainer._leaflet_id) {
        mapContainer._leaflet_id = null;
    }

    const defaultLat = 18.5204; // Pune Coordinates
    const defaultLng = 73.8567;

    map = L.map('map').setView([defaultLat, defaultLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

    marker.on('dragend', () => getAddress(marker.getLatLng().lat, marker.getLatLng().lng));
    map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        getAddress(e.latlng.lat, e.latlng.lng);
    });
}

async function getAddress(lat, lng) {
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
    const locInput = document.getElementById('location');
    locInput.value = "Fetching address...";

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        locInput.value = data.display_name || "Unknown Location";
    } catch { locInput.value = "Error fetching address"; }
}

async function searchArea() {
    const query = document.getElementById('mapSearch').value;
    if (!query) return;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Pune")}`);
        const results = await res.json();
        if (results.length > 0) {
            const { lat, lon, display_name } = results[0];
            map.setView([lat, lon], 16);
            marker.setLatLng([lat, lon]);
            document.getElementById('location').value = display_name;
            document.getElementById('latitude').value = lat;
            document.getElementById('longitude').value = lon;
        }
    } catch { alert("Search service error"); }
}

function toggleOtherCategory() {
    const categorySelect = document.getElementById("category");
    const otherInput = document.getElementById("otherCategoryInput");
    const isOther = categorySelect.value === "Other";
    otherInput.style.display = isOther ? "block" : "none";
    otherInput.required = isOther;
}



function getUserLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            map.setView([lat, lng], 16);
            marker.setLatLng([lat, lng]);

            getAddress(lat, lng); // existing reverse geocode function
        },
        () => {
            alert("Unable to retrieve your location.");
        }
    );
}

// ==========================================
// 5. IMAGE MODAL FUNCTIONS
// ==========================================
function openImageModal(imageSrc, captionText) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const caption = document.getElementById('caption');
    
    modal.style.display = 'block';
    modalImg.src = imageSrc;
    caption.innerHTML = captionText || 'Complaint Image';
    
    // Close modal when clicking outside the image
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeImageModal();
        }
    }
    
    // Close modal with Escape key
    document.onkeydown = function(event) {
        if (event.key === 'Escape') {
            closeImageModal();
        }
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
}

