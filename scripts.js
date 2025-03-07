document.addEventListener('DOMContentLoaded', () => {
    // Añadir la constante GITHUB_BASE_URL (¡CAMBIAR POR TU REPOSITORIO!)
    const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/imroxas/autoparts/main/';
    
    // Resto de variables
    let fullData = [];
    
    // Referencias a elementos del DOM
    const searchInput = document.querySelector('.search-input');
    const statusMessage = document.getElementById('statusMessage');
    const partNumberElem = document.getElementById('partNumber');
    const partTitleElem = document.getElementById('partTitle');
    const categoryElem = document.getElementById('category');
    const materialElem = document.getElementById('material');
    const axisElem = document.getElementById('axis');
    const heightElem = document.getElementById('height');
    const widthElem = document.getElementById('width');
    const thicknessElem = document.getElementById('thickness');
    const productImageElem = document.getElementById('productImage');
    const relatedOemsBody = document.getElementById('relatedOemsBody');
    const compatibilitiesBody = document.getElementById('compatibilitiesBody');
    const diameterElem = document.getElementById('diameter');
    const centeredDiameterElem = document.getElementById('centeredDiameter');
    const holesElem = document.getElementById('holes');
    const internalHeightElem = document.getElementById('internalHeight');

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
                    diametro_centrado: parseFloat(part.diametro_centrado) || null,
                    taladros: part.taladros || '-',
                    altura_interna: parseFloat(part.altura_interna) || null,
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
        // Mostrar campos comunes
        productImageElem.style.backgroundImage = `url(${part.imagen})`;
        partNumberElem.textContent = part.id;
        partTitleElem.textContent = part.nombre;
        categoryElem.textContent = part.categoria;
        materialElem.textContent = part.materiales.map(m => m.tipo).join(', ');
        axisElem.textContent = part.eje || '-';
        diameterElem.textContent = part.diametro || '-';
        centeredDiameterElem.textContent = part.diametro_centrado || '-';
        holesElem.textContent = part.taladros || '-';
        internalHeightElem.textContent = part.altura_interna || '-';
    
        // Obtener todos los campos de especificaciones
        const specRows = document.querySelectorAll('.specs-table tr[data-category]');
        
        // Ocultar todos los campos primero
        specRows.forEach(row => row.style.display = 'none');
    
        // Mostrar campos relevantes según categoría
        specRows.forEach(row => {
            const categories = row.dataset.category.split(',');
            if (categories.includes(part.categoria) || categories.includes('all')) {
                row.style.display = '';
                
                // Llenar datos específicos
                const fieldId = row.querySelector('td:last-child').id;
                switch(fieldId) {
                    case 'width':
                        row.querySelector('td:last-child').textContent = part.ancho || '-';
                        break;
                    case 'height':
                        row.querySelector('td:last-child').textContent = part.alto || '-';
                        break;
                    case 'thickness':
                        row.querySelector('td:last-child').textContent = part.espesor || '-';
                        break;
                    case 'diameter':
                        row.querySelector('td:last-child').textContent = part.diametro || '-';
                        break;
                    case 'centeredDiameter':
                        row.querySelector('td:last-child').textContent = part.diametro_centrado || '-';
                        break;
                    case 'holes':
                        row.querySelector('td:last-child').textContent = part.taladros || '-';
                        break;
                    case 'internalHeight':
                        row.querySelector('td:last-child').textContent = part.altura_interna || '-';
                        break;
                }
            }
        });

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

const specsContainer = document.getElementById('specsContainer');

function displayPartData(part) {
    // Mostrar contenedor
    specsContainer.classList.add('visible');
    
    // ... resto de tu código actual ...
}

function clearResults() {
    // Ocultar contenedor
    specsContainer.classList.remove('visible');
    
    // ... resto de tu código actual ...
}
    
    function clearResults() {
        productImageElem.style.backgroundImage = '';
        partNumberElem.textContent = '-';
        partTitleElem.textContent = '-'; 
        categoryElem.textContent = '-';
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

document.querySelector('.search-input')?.addEventListener('input', function(e) {
    const originalValue = this.value;
    this.value = this.value.replace(/[\s-]/g, '');
    
    if(this.value !== originalValue) {
        this.classList.add('invalid');
        setTimeout(() => this.classList.remove('invalid'), 1000);
    }
});
