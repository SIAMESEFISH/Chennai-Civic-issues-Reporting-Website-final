// ==========================================
// 0. CONFIGURATION
// ==========================================
const API_URL = "http://localhost:5000/api/complaints";

// Global variable for the map
var adminMap;

// ==========================================
// 1. INITIALIZE MAP
// ==========================================
function initAdminMap() {
    const mapContainer = document.getElementById('adminMap');
    
    // Safety: Exit if the map container isn't found
    if (!mapContainer) return;

    // Destroy previous instance if it exists to prevent "already initialized" error
    if (adminMap) {
        adminMap.remove();
    }

    // Initialize Map centered on Pune
    adminMap = L.map('adminMap').setView([18.5204, 73.8567], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(adminMap);

    // Refresh size for flexbox layout (prevents gray box issue)
    setTimeout(() => {
        adminMap.invalidateSize();
    }, 500);

    // Fetch and plot data
    loadComplaintsOnMap();
}

// ==========================================
// 2. PLOT DATA ON MAP
// ==========================================
async function loadComplaintsOnMap() {
    try {
        const res = await fetch(API_URL);
        const complaints = await res.json();
        
        const validLocations = [];

        complaints.forEach(complaint => {
            // Only plot if coordinates exist
            if (complaint.latitude && complaint.longitude) {
                const lat = parseFloat(complaint.latitude);
                const lng = parseFloat(complaint.longitude);
                
                validLocations.push([lat, lng]);

                // Determine color: Bright Green for Resolved, Red for others
                const markerColor = complaint.status === 'Resolved' ? '#2ecc71' : '#ff0000';
                const markerOpacity = complaint.status === 'Resolved' ? 0.8 : 1;

                const marker = L.circleMarker([lat, lng], {
                    radius: 15,          // Big visible dots
                    fillColor: markerColor,
                    color: "#ffffff",    // White border
                    weight: 3,           // Thick border
                    opacity: 1,
                    fillOpacity: markerOpacity       // Solid color
                }).addTo(adminMap);

                // Add hover effect
                marker.on('mouseover', function() {
                    this.setStyle({
                        radius: 18,
                        weight: 4
                    });
                });

                marker.on('mouseout', function() {
                    this.setStyle({
                        radius: 15,
                        weight: 3
                    });
                });

                // Get category icon
                const categoryIcons = {
                    'Road Damage': '🚧',
                    'Garbage': '🗑️',
                    'Street Light': '💡',
                    'Water Supply': '💧',
                    'Drainage': '🚰',
                    'Park': '🌳',
                    'Other': '📋'
                };
                const icon = categoryIcons[complaint.category] || '📋';

                // Format status with color
                const statusColor = complaint.status === 'Resolved' ? '#059669' : '#dc2626';
                const statusBg = complaint.status === 'Resolved' ? '#d1fae5' : '#fee2e2';

                // Truncate description if too long
                const description = complaint.description || 'No description provided';
                const truncatedDesc = description.length > 150 
                    ? description.substring(0, 150) + '...' 
                    : description;

                // Popup with enhanced issue details
                marker.bindPopup(`
                    <div style="font-family: 'Segoe UI', sans-serif; min-width: 250px; max-width: 300px;">
                        <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); 
                                    color: white; 
                                    padding: 12px; 
                                    margin: -15px -20px 12px -20px; 
                                    border-radius: 8px 8px 0 0;">
                            <div style="font-size: 20px; margin-bottom: 5px;">${icon}</div>
                            <div style="font-size: 16px; font-weight: 600;">${complaint.category}</div>
                        </div>
                        
                        <div style="padding: 0 5px;">
                            <div style="margin-bottom: 12px;">
                                <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">DESCRIPTION</div>
                                <div style="font-size: 13px; color: #374151; line-height: 1.5;">${truncatedDesc}</div>
                            </div>
                            
                            <div style="margin-bottom: 10px;">
                                <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">LOCATION</div>
                                ${complaint.wardNumber ? `<div style="font-size: 13px; color: #16a34a; font-weight: 600;">📍 ${complaint.wardNumber}</div>` : ''}
                                <div style="font-size: 13px; color: #374151;">${complaint.area || 'Not specified'}</div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                                <div>
                                    <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">STATUS</div>
                                    <div style="display: inline-block; 
                                                padding: 4px 10px; 
                                                background: ${statusBg}; 
                                                color: ${statusColor}; 
                                                border-radius: 12px; 
                                                font-size: 11px; 
                                                font-weight: 600;">
                                        ${complaint.status}
                                    </div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 4px;">REPORTS</div>
                                    <div style="font-size: 16px; color: #16a34a; font-weight: 700;">
                                        ${complaint.reportCount || 1}
                                    </div>
                                </div>
                            </div>
                            
                            <div style="padding-top: 10px; border-top: 1px solid #e5e7eb;">
                                <div style="font-size: 10px; color: #9ca3af;">
                                    <b>ID:</b> ${complaint.complaintId}
                                </div>
                            </div>
                        </div>
                    </div>
                `, {
                    maxWidth: 300,
                    className: 'custom-popup'
                });
            }
        });

        // Auto-zoom to fit all markers on the screen
        if (validLocations.length > 0) {
            const bounds = L.latLngBounds(validLocations);
            adminMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }

    } catch (err) {
        console.error("Map Data Error:", err);
    }
}

// ==========================================
// 3. ADMIN ACTIONS (OPTIONAL)
// ==========================================
// Function to update status directly from a map context if needed
async function updateStatusFromMap(id) {
    if (confirm("Mark this issue as Resolved?")) {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Resolved" })
            });
            location.reload(); // Refresh to update marker color
        } catch (err) {
            alert("Update failed");
        }
    }
}

// Start the map after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initAdminMap);
