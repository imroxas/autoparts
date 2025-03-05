document.addEventListener('DOMContentLoaded', () => {
    // Eliminar el código mockeado y usar datos reales
    let fullData = [];
    
    // Referencias a elementos del DOM
    const searchInput = document.querySelector('.search-input');
    const statusMessage = document.getElementById('statusMessage');
    const partNumberElem = document.getElementById('partNumber');
    const materialElem = document.getElementById('material');
    const axisElem = document.getElementById('axis');
    const heightElem = document.getElementById('height');
    const widthElem = document.getElementById('width');
    const thicknessElem = document.getElementById('thickness');
    const productImageElem = document.getElementById('productImage');
    const relatedOemsBody = document.getElementById('relatedOemsBody');
    const compatibilitiesBody = document.getElementById('compatibilitiesBody');

    // Cargar datos al iniciar
    loadData();

    async function loadData() {
        try {
            // Cargar datos desde GitHub (ajusta las rutas según tu repositorio)
            const [parts, oems, compats] = await Promise.all([
                fetchData('datos/parts.json'),
                fetchCSV('datos/oems.csv'),
                fetchCSV('datos/compatibilidades.csv')
            ]);

            // Combinar datos
            fullData = parts.map(part => ({
                ...part,
                oems: oems.filter(oem => oem.id_parte === part.id),
                compatibilidades: compats.filter(comp => comp.id_parte === part.id)
            }));

            initSearch();
        } catch (error) {
            showError('Error cargando datos: ' + error.message);
        }
    }

    async function fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async function fetchCSV(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const csv = await response.text();
        return csvToJson(csv);
    }

    function csvToJson(csv) {
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim());
        return lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index]?.trim() || '';
                return obj;
            }, {});
        });
    }

    function initSearch() {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    function handleSearch(e) {
        const query = e.target.value.trim().toUpperCase();
        clearResults();

        if (!query) return;

        const foundPart = fullData.find(part => 
            part.id.toUpperCase() === query || 
            part.oems.some(oem => oem.numero_oem.toUpperCase() === query)
        );

        if (foundPart) {
            displayPartData(foundPart);
            showStatus('Resultados encontrados', 'success');
        } else {
            showStatus('No se encontraron resultados', 'error');
        }
    }

    function displayPartData(part) {
        // Mostrar imagen
        productImageElem.style.backgroundImage = `url(${part.imagen})`;
        
        // Mostrar datos principales
        partNumberElem.textContent = part.id;
        materialElem.textContent = part.materiales.map(m => m.tipo).join(', ');
        axisElem.textContent = part.eje || '-';
        
        // Manejar diferentes categorías
        const measures = {
            pastilla: { width: part.ancho, height: part.alto, thickness: part.espesor },
            balata: { width: part.ancho, height: part.diametro, thickness: '-' },
            disco: { width: part.alto, height: part.diametro, thickness: part.espesor },
            tambor: { width: part.alto, height: part.diametro, thickness: part.altura_interna }
        };
        
        const { width, height, thickness } = measures[part.categoria] || {};
        widthElem.textContent = width || '-';
        heightElem.textContent = height || '-';
        thicknessElem.textContent = thickness || '-';

        // Mostrar OEMs
        relatedOemsBody.innerHTML = part.oems.map(oem => `
            <tr>
                <td>${oem.numero_oem}</td>
                <td>${oem.marca}</td>
            </tr>
        `).join('');

        // Mostrar compatibilidades
        compatibilitiesBody.innerHTML = part.compatibilidades.map(comp => `
            <tr>
                <td>${comp.marca}</td>
                <td>${comp.modelo}</td>
                <td>${comp.motor || '-'}</td>
                <td>${comp.años}</td>
            </tr>
        `).join('');
    }

    function clearResults() {
        productImageElem.style.backgroundImage = '';
        partNumberElem.textContent = '-';
        materialElem.textContent = '-';
        axisElem.textContent = '-';
        widthElem.textContent = '-';
        heightElem.textContent = '-';
        thicknessElem.textContent = '-';
        relatedOemsBody.innerHTML = '';
        compatibilitiesBody.innerHTML = '';
    }

    function debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = 'block';
    }

    function showError(message) {
        console.error(message);
        statusMessage.textContent = message;
        statusMessage.className = 'status-message error';
        statusMessage.style.display = 'block';
    }
});
