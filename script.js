const violationsUrl = 'https://data.cityofnewyork.us/resource/43nn-pn8j.geojson?$query=SELECT%0A%20%20%60camis%60%2C%0A%20%20%60dba%60%2C%0A%20%20%60boro%60%2C%0A%20%20%60building%60%2C%0A%20%20%60street%60%2C%0A%20%20%60zipcode%60%2C%0A%20%20%60phone%60%2C%0A%20%20%60cuisine_description%60%2C%0A%20%20%60inspection_date%60%2C%0A%20%20%60action%60%2C%0A%20%20%60violation_code%60%2C%0A%20%20%60violation_description%60%2C%0A%20%20%60critical_flag%60%2C%0A%20%20%60score%60%2C%0A%20%20%60grade%60%2C%0A%20%20%60grade_date%60%2C%0A%20%20%60record_date%60%2C%0A%20%20%60inspection_type%60%2C%0A%20%20%60latitude%60%2C%0A%20%20%60longitude%60%2C%0A%20%20%60community_board%60%2C%0A%20%20%60council_district%60%2C%0A%20%20%60census_tract%60%2C%0A%20%20%60bin%60%2C%0A%20%20%60bbl%60%2C%0A%20%20%60nta%60%2C%0A%20%20%60location_point1%60%0AWHERE%0A%20%20(%60inspection_date%60%0A%20%20%20%20%20BETWEEN%20%222023-11-04T14%3A20%3A56%22%20%3A%3A%20floating_timestamp%0A%20%20%20%20%20AND%20%222024-11-04T14%3A20%3A56%22%20%3A%3A%20floating_timestamp)%0A%20%20AND%20caseless_one_of(%0A%20%20%20%20%60action%60%2C%0A%20%20%20%20%22Violations%20were%20cited%20in%20the%20following%20area(s).%22%0A%20%20)%0AORDER%20BY%20%60inspection_date%60%20DESC%20NULL%20LAST';
const noViolationsUrl = 'https://data.cityofnewyork.us/resource/43nn-pn8j.geojson?$query=SELECT%20%60camis%60,%20%60dba%60,%20%60boro%60,%20%60building%60,%20%60street%60,%20%60zipcode%60,%20%60phone%60,%20%60cuisine_description%60,%20%60inspection_date%60,%20%60action%60,%20%60violation_code%60,%20%60violation_description%60,%20%60critical_flag%60,%20%60score%60,%20%60grade%60,%20%60grade_date%60,%20%60record_date%60,%20%60inspection_type%60,%20%60latitude%60,%20%60longitude%60,%20%60community_board%60,%20%60council_district%60,%20%60census_tract%60,%20%60bin%60,%20%60bbl%60,%20%60nta%60,%20%60location_point1%60%20WHERE%20%60inspection_date%60%20BETWEEN%20%222023-11-04T12%3A42%3A16%22%20AND%20%222024-11-04T12%3A42%3A16%22%20AND%20%60action%60%20=%20%22No%20violations%20were%20recorded%20at%20the%20time%20of%20this%20inspection.%22';





const map = L.map('map').setView([40.7128, -74.0060], 12);




const CartoDB_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

let markers = [];





const fetchData = async () => {
    try {
        const [violationResponse, noViolationResponse] = await Promise.all([
           fetch(violationsUrl),
            fetch(noViolationsUrl)
        ]);
				if (!violationResponse.ok) {
            throw new Error(`Failed to fetch violations data: ${violationResponse.statusText}`);
        }






        if (!noViolationResponse.ok) {
            throw new Error(`Failed to fetch no-violations data: ${noViolationResponse.statusText}`);
        }

        const violationData = await violationResponse.json();
        const noViolationData = await noViolationResponse.json();





        document.getElementById('total-inspections').textContent = violationData.features.length + noViolationData.features.length;
        document.getElementById('violation-count').textContent = violationData.features.length;
        document.getElementById('no-violation-count').textContent = noViolationData.features.length;





        const addMarkers = (data, color) => {
            data.features.forEach(feature => {
                const { latitude, longitude, dba, building, street, phone, cuisine_description, critical_flag, inspection_date, score, violation_description } = feature.properties;

                // Check if latitude and longitude are valid
                if (latitude && longitude) {
                    const marker = L.circleMarker([latitude, longitude], { color, radius: 5 })
                        .addTo(map)
                        .bindPopup(`
                            <strong>Name:</strong> ${dba || 'N/A'}<br>
                            <strong>Address:</strong> ${building || 'N/A'} ${street || 'N/A'}<br>
                            <strong>Phone:</strong> ${phone || 'N/A'}<br>
                            <strong>Cuisine:</strong> ${cuisine_description || 'N/A'}<br>
                            <strong>Critical Flag:</strong> ${critical_flag || 'N/A'}<br>
                            <strong>Violation:</strong> ${violation_description || 'N/A'}<br>
                            <strong>Inspection Date:</strong> ${inspection_date || 'N/A'}<br>
                            <strong>Score:</strong> ${score || 'N/A'}
                        `);

                    markers.push({ marker, dba });
                    
                }
            });
        };

        addMarkers(violationData, '#e07a5f');
        addMarkers(noViolationData, '#f4f1de');

        const recentViolations = violationData.features
            .map(feature => feature.properties)
            .sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date))
            .slice(0, 20);

        recentViolations.forEach(violation => {
            const { dba, inspection_date } = violation;
            document.getElementById('recent-violations').insertAdjacentHTML('beforeend', `<li>${dba || 'N/A'} - ${inspection_date || 'N/A'}</li>`);
        });


fetchData();



document.getElementById('search-input').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    markers.forEach(({ marker, dba }) => {
        if (dba.toLowerCase().includes(searchTerm)) {
            marker.addTo(map);
        } else {
            map.removeLayer(marker);
        }
    });
});
