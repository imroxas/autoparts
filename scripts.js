document.addEventListener('DOMContentLoaded', () => {
    // Añadir la constante GITHUB_BASE_URL (¡CAMBIAR POR TU REPOSITORIO!)
    const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/imroxas/autoparts/main/';
    
    // Resto de variables
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
            const [parts, oems, compats] = await Promise.all([
                fetchCSV('datos/parts.csv'),
                fetchCSV('datos/oems.csv'),
                fetchCSV('datos/compatibilidades.csv')
            ]);
    
            // Procesar partes
            const processedParts = parts.map(part => {
                return {
                    id: part.id_parte,
                    nombre: part.title,
                    categoria: part.categoria.toLowerCase(),
                    eje: part.eje,
                    materiales: obtenerMateriales(part),
                    ancho: parseFloat(part.ancho) || null,
                    alto: parseFloat(part.alto) || null,
                    espesor: parseFloat(part.espesor) || null,
                    diametro: parseFloat(part.diametro) || null, // Para discos/tambores
                    altura_interna: parseFloat(part.altura_interna) || null, // Para tambores
                    imagen: `imgs/${part.imagen}`
                };
            });
    
            // Combinar datos
            fullData = processedParts.map(part => ({
                ...part,
                oems: oems.filter(oem => oem.id_parte === part.id),
                compatibilidades: compats.filter(comp => comp.id_parte === part.id)
            }));
    
            initSearch();
        } catch (error) {
            showError('Error cargando datos: ' + error.message);
        }
    }
    
    // Función para obtener materiales
    function obtenerMateriales(part) {
        const materiales = [];
        if (part.semimetalica === 'true') materiales.push({ tipo: 'Semi-metálico' });
        if (part.ceramica === 'true') materiales.push({ tipo: 'Cerámica' });
        if (part.low_metal === 'true') materiales.push({ tipo: 'Low metal' });
        return materiales;
    }
    
    // Modificar la función fetchCSV para convertir valores
    async function fetchCSV(url) {
        const response = await fetch(`${GITHUB_BASE_URL}${url}`);
        if (!response.ok) throw new Error(`Error HTTP! estado: ${response.status}`);
        const csv = await response.text();
        return csvToJson(csv);
    }
    
    // Actualizar función csvToJson para manejar valores
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
    
        if (!query) {
            showStatus('Ingrese un término de búsqueda', 'info');
            return;
        }
    
        const foundPart = fullData.find(part => 
            part.id.toUpperCase() === query || 
            part.oems.some(oem => oem.numero_oem.toUpperCase() === query)
        );
    
        if (foundPart) {
            displayPartData(foundPart);
            showStatus('Resultados encontrados', 'success'); // Mensaje en verde
        } else {
            showStatus('No se encontraron resultados', 'error'); // Mensaje en rojo
        }
    }

    function displayPartData(part) {
        // Mostrar imagen
        productImageElem.style.backgroundImage = `url(${part.imagen})`;
        
        // Mostrar datos principales
        partNumberElem.textContent = part.id;
        materialElem.textContent = part.materiales.map(m => m.tipo).join(', ');
        axisElem.textContent = part.eje || '-';

        // Mostrar título y categoría (si agregaste los nuevos <td>)
        document.getElementById('partTitle').textContent = part.nombre;
        document.getElementById('category').textContent = part.categoria;
        
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
