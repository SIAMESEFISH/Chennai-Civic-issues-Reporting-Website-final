// ==========================================
// 0. CONFIGURATION
// ==========================================
const API_URL = "http://localhost:5000/api/complaints";
const WORKER_API_URL = "http://localhost:5000/api/workers";

let allWorkers = [];

// ==========================================
// 1. DATA LOADING (TABLE)
// ==========================================
async function loadAdminComplaints() {
    try {
        // Load workers first for assignment dropdown
        await loadWorkers();

        const res = await fetch(API_URL);
        const data = await res.json();

        const table = document.getElementById("adminTable");
        if (!table) return;
        
        table.innerHTML = "";

        data.forEach(c => {
            const reporters = Array.isArray(c.sameIssueReports) ? c.sameIssueReports : [];
            const reportersCount = reporters.length;
            const reportersData = encodeURIComponent(JSON.stringify(reporters));

            // Get assigned worker info
            const assignedWorker = c.assignedTo?.workerName || "Unassigned";
            const isAssigned = c.assignedTo?.workerId ? true : false;
            
            // Get work progress details
            const workStarted = c.workProgress?.startedAt;
            const workCompleted = c.workProgress?.completedAt;
            const workerNotes = c.workProgress?.workerNotes;
            const resolvedImage = c.workProgress?.resolvedImage;
            const userVerification = c.workProgress?.userVerification;
            
            // Build worker info display with progress
            let workerDisplay = `<strong style="color: ${isAssigned ? '#16a34a' : '#6b7280'};">${assignedWorker}</strong>`;
            
            if (workStarted) {
                workerDisplay += `<div style="font-size: 11px; color: #3b82f6;">Started: ${new Date(workStarted).toLocaleString()}</div>`;
            }
            if (workCompleted) {
                workerDisplay += `<div style="font-size: 11px; color: #16a34a;">✅ Completed: ${new Date(workCompleted).toLocaleString()}</div>`;
            }
            if (workerNotes) {
                workerDisplay += `<div style="font-size: 11px; color: #6b7280; margin-top: 4px;">📝 ${workerNotes.substring(0, 50)}${workerNotes.length > 50 ? '...' : ''}</div>`;
            }

            const resolvedProofDisplay = resolvedImage
                ? `<img src="http://localhost:5000/uploads/${resolvedImage}" width="80" onclick="openImageModal('http://localhost:5000/uploads/${resolvedImage}', 'Resolved proof - ${c.complaintId}')" title="Click to view resolved proof">`
                : '<span style="color: #6b7280; font-size: 12px;">Not uploaded</span>';

            let userVerificationDisplay = '<span style="color: #6b7280; font-size: 12px;">Not verified</span>';
            if (userVerification?.verified) {
                const verifiedAt = userVerification.verifiedAt
                    ? new Date(userVerification.verifiedAt).toLocaleString()
                    : 'Verified';
                userVerificationDisplay = `
                    <span style="color: #16a34a; font-weight: 600; font-size: 12px;">✅ Verified</span>
                    <div style="font-size: 11px; color: #6b7280;">By: ${userVerification.verifiedByName || 'User'}</div>
                    <div style="font-size: 11px; color: #6b7280;">At: ${verifiedAt}</div>
                `;
            }

            table.innerHTML += `
                <tr>
                    <td>${c.complaintId}</td>
                    <td>${c.name}</td>
                    <td>
                        ${c.image ? `<img src="http://localhost:5000/uploads/${c.image}" width="80" onclick="openImageModal('http://localhost:5000/uploads/${c.image}', 'ID: ${c.complaintId} - ${c.category}')" title="Click to view full size">` : "No Image"}
                    </td>
                    <td>${c.category}</td>
                    <td>${c.wardNumber || c.area}</td>
                    <td>${c.area || "Not provided"}</td>
                    <td><span class="status-badge ${c.status.toLowerCase()}">${c.status}</span></td>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            ${workerDisplay}
                            ${!isAssigned && c.status !== "Resolved" ? `
                                <button class="btn-assign" onclick="showAssignDialog('${c._id}', '${c.wardNumber || c.area}')" style="padding: 4px 8px; font-size: 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    Assign Worker
                                </button>
                            ` : ''}
                            ${isAssigned && c.status !== "Resolved" ? `
                                <button class="btn-reassign" onclick="showReassignDialog('${c._id}', '${c.wardNumber || c.area}', '${c.assignedTo.workerId}')" style="padding: 4px 8px; font-size: 12px; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    Reassign
                                </button>
                                <button class="btn-unassign" onclick="unassignWorker('${c._id}')" style="padding: 4px 8px; font-size: 12px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    Unassign
                                </button>
                            ` : ''}
                        </div>
                    </td>
                    <td>${resolvedProofDisplay}</td>
                    <td>${userVerificationDisplay}</td>
                    <td>
                        ${reportersCount > 0
                            ? `<button class="btn-view" data-reporters="${reportersData}" onclick="showReporters(this)">View (${reportersCount})</button>`
                            : "None"
                        }
                    </td>
                    <td>
                        ${c.status !== "Resolved" ? `
                            <button class="btn-resolve" data-id="${c._id}" onclick="markResolved(this)">
                                Mark Resolved
                            </button>
                        ` : `
                            <button class="btn-danger" data-id="${c._id}" onclick="deleteComplaint(this)">
                                Delete
                            </button>
                        `}
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
        alert("Failed to load complaints from server.");
    }
}

// Load workers for assignment
async function loadWorkers() {
    try {
        const res = await fetch(WORKER_API_URL);
        allWorkers = await res.json();
    } catch (err) {
        console.error("Error loading workers:", err);
        allWorkers = [];
    }
}

// ==========================================
// 2. ADMIN ACTIONS (PUT & DELETE)
// ==========================================
async function markResolved(btn) {
    const id = btn.dataset.id;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Resolved" })
        });

        if (!res.ok) throw new Error("Update failed");

        alert("Complaint marked as Resolved");
        loadAdminComplaints(); // Refresh Table
        drawAdminChart();      // Refresh Chart
    } catch (err) {
        console.error(err);
        alert("Error updating status.");
    }
}

async function deleteComplaint(btn) {
    const id = btn.dataset.id;

    if (!confirm("Are you sure you want to permanently delete this complaint?")) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

        if (!res.ok) {
            const msg = await res.json();
            alert(msg.message || "Delete failed");
            return;
        }

        alert("Complaint deleted successfully");
        loadAdminComplaints();
        drawAdminChart();
    } catch (err) {
        console.error(err);
        alert("Server error during deletion.");
    }
}

function showReporters(button) {
    const encoded = button.dataset.reporters || "";

    if (!encoded) {
        alert("No users have reported this issue yet.");
        return;
    }

    let reporters = [];

    try {
        reporters = JSON.parse(decodeURIComponent(encoded));
    } catch (err) {
        alert("Unable to load reporter details.");
        return;
    }

    if (!Array.isArray(reporters) || reporters.length === 0) {
        alert("No users have reported this issue yet.");
        return;
    }

    const lines = reporters.map((reporter, index) => {
        const name = reporter.name || "Unknown";
        const email = reporter.email || "N/A";
        const reportedAt = reporter.reportedAt
            ? new Date(reporter.reportedAt).toLocaleString()
            : "Unknown time";
        return `${index + 1}. ${name} (${email}) - ${reportedAt}`;
    });

    alert(`Users who reported the same issue:\n\n${lines.join("\n")}`);
}

// ==========================================
// 3. ANALYTICS (GOOGLE CHARTS)
// ==========================================
google.charts.load('current', { 'packages': ['corechart'] });
google.charts.setOnLoadCallback(drawAdminChart);

async function drawAdminChart() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        const statusCounts = { "Pending": 0, "Resolved": 0 };
        data.forEach(c => {
            const s = c.status || "Pending";
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        const chartData = google.visualization.arrayToDataTable([
            ['Status', 'Count', { role: 'style' }],
            ['Pending', statusCounts["Pending"], '#e74c3c'],  // Red
            ['Resolved', statusCounts["Resolved"], '#2ecc71'] // Green
        ]);

        const isDarkMode = document.body.classList.contains("dark");
        const textColor = isDarkMode ? "#f0f0f0" : "#333333";

        const options = {
            title: 'Complaint Resolution Status',
            titleTextStyle: { color: textColor, fontSize: 18, bold: true },
            backgroundColor: 'transparent',
            hAxis: {
                title: 'Status',
                titleTextStyle: { color: textColor },
                textStyle: { color: textColor }
            },
            vAxis: {
                title: 'Number of Complaints',
                titleTextStyle: { color: textColor },
                textStyle: { color: textColor },
                gridlines: { color: isDarkMode ? '#444' : '#ccc' },
                viewWindow: { min: 0 }
            },
            legend: { position: 'none' },
            animation: { duration: 800, easing: 'out', startup: true }
        };

        const chartElement = document.getElementById('adminStatusChart');
        if (chartElement) {
            const chart = new google.visualization.ColumnChart(chartElement);
            chart.draw(chartData, options);
        }
    } catch (err) {
        console.error("Admin chart error:", err);
    }
}

// ==========================================
// 4. THEME & INITIALIZATION
// ==========================================
function toggleTheme() {
    document.body.classList.toggle("dark");
    const currentTheme = document.body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("theme", currentTheme);

    // Re-draw chart to update colors
    if (typeof drawAdminChart === 'function') drawAdminChart();
}

// Run when page loads
document.addEventListener("DOMContentLoaded", () => {
    // Apply saved theme
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
    }
    
    // Load initial data
    loadAdminComplaints();
});

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

// ==========================================
// 6. WORKER ASSIGNMENT FUNCTIONS
// ==========================================
function showAssignDialog(complaintId, wardNumber) {
    // Filter workers by ward - check if worker's assigned wards include the complaint's ward
    const availableWorkers = allWorkers.filter(w => {
        if (!w.isActive) return false;
        
        // Check if worker's assigned ward contains this ward number
        const workerWards = w.assignedWard.toLowerCase();
        const complaintWard = wardNumber.toLowerCase();
        
        return workerWards.includes(complaintWard);
    });

    if (availableWorkers.length === 0) {
        alert(`No active workers available for Ward Number: ${wardNumber}\n\nPlease register a worker for this ward first.`);
        return;
    }

    const workerOptions = availableWorkers.map(w => 
        `${w.workerId}: ${w.name} (${w.specialization})`
    ).join('\n');

    const selectedWorker = prompt(
        `Select a worker to assign:\n\n${workerOptions}\n\nEnter Worker ID:`
    );

    if (selectedWorker) {
        const worker = availableWorkers.find(w => w.workerId === selectedWorker.trim());
        if (worker) {
            assignWorkerToTask(complaintId, worker.workerId, worker.name);
        } else {
            alert("Invalid Worker ID");
        }
    }
}

function showReassignDialog(complaintId, wardNumber, currentWorkerId) {
    // Filter workers by ward, excluding current worker
    const availableWorkers = allWorkers.filter(w => {
        if (!w.isActive || w.workerId === currentWorkerId) return false;
        
        // Check if worker's assigned ward contains this ward number
        const workerWards = w.assignedWard.toLowerCase();
        const complaintWard = wardNumber.toLowerCase();
        
        return workerWards.includes(complaintWard);
    });

    if (availableWorkers.length === 0) {
        alert(`No other active workers available for Ward Number: ${wardNumber}`);
        return;
    }

    const workerOptions = availableWorkers.map(w => 
        `${w.workerId}: ${w.name} (${w.specialization})`
    ).join('\n');

    const selectedWorker = prompt(
        `Reassign to another worker:\n\n${workerOptions}\n\nEnter Worker ID:`
    );

    if (selectedWorker) {
        const worker = availableWorkers.find(w => w.workerId === selectedWorker.trim());
        if (worker) {
            assignWorkerToTask(complaintId, worker.workerId, worker.name);
        } else {
            alert("Invalid Worker ID");
        }
    }
}

async function assignWorkerToTask(complaintId, workerId, workerName) {
    const adminUsername = localStorage.getItem("adminUsername");

    try {
        const res = await fetch(`${API_URL}/${complaintId}/assign`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                workerId,
                workerName,
                assignedBy: adminUsername || "Admin"
            })
        });

        if (!res.ok) {
            const error = await res.json();
            alert(error.message || "Assignment failed");
            return;
        }

        alert(`✅ Task assigned to ${workerName}`);
        loadAdminComplaints();
    } catch (err) {
        console.error(err);
        alert("Failed to assign task");
    }
}

async function unassignWorker(complaintId) {
    if (!confirm("Are you sure you want to unassign this task?")) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/${complaintId}/unassign`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        });

        if (!res.ok) {
            alert("Failed to unassign task");
            return;
        }

        alert("✅ Task unassigned successfully");
        loadAdminComplaints();
    } catch (err) {
        console.error(err);
        alert("Failed to unassign task");
    }
}
