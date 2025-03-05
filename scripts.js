document.addEventListener('DOMContentLoaded', () => {
    // Manejo de botones
    document.querySelectorAll('.search-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'search.html';
        });
    });
    
    // Manejo de carga de Excel
    const excelUpload = document.getElementById('excelUpload');
    document.querySelector('.excel-btn')?.addEventListener('click', () => {
        excelUpload?.click();
    });
});

// scripts.js

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar funcionalidad de búsqueda
    initSearchFunctionality();
});

function initSearchFunctionality() {
    // Datos mockeados (sin cambios)
    const parts = [
        {
            "id": "M1049",
            "nombre": "M1049/M1109 - Pastillas de Freno Cerámica Delanteras Nissan Qashqai, Xtrail",
            "categoria": "pastilla",
            "eje": "Delantero",
            "materiales": [
                {"tipo": "Semi-metálico"},
                {"tipo": "Cerámica"},
                {"tipo": "Low metal"}
            ],
            "ancho": 141.9,
            "alto": 58.6,
            "espesor": 16.8,
            "imagen": "imgs/M1049.svg"
        },
        // Puedes agregar más piezas aquí
    ];

    const oems = [
        { "id_parte": "M1049", "numero_oem": "D1060JD00A", "marca": "NISSAN" },
        { "id_parte": "M1049", "numero_oem": "D1080JE00A", "marca": "NISSAN" },
        // Agrega más OEMs aquí
    ];

    const compatibilidades = [
        { "id_parte": "M1049", "marca": "NISSAN", "modelo": "X-Trail II", "motor": "2.0", "años": "2007-2016" },
        { "id_parte": "M1049", "marca": "NISSAN", "modelo": "X-Trail II", "motor": "2.5", "años": "2007-2015" },
        // Agrega más compatibilidades aquí
    ];

    // Relacionar datos (sin cambios)
    const data = parts.map(part => ({
        ...part,
        oems: oems.filter(oem => oem.id_parte === part.id),
        compatibilidades: compatibilidades.filter(comp => comp.id_parte === part.id)
    }));

    // Referencias a elementos del DOM
    const searchInput = document.querySelector('.search-input');
    const statusMessage = document.getElementById('statusMessage');

    const partNumberElem = document.getElementById('partNumber');
    const materialElem = document.getElementById('material');
    const axisElem = document.getElementById('axis'); // Actualizado
    const heightElem = document.getElementById('height');
    const widthElem = document.getElementById('width');
    const thicknessElem = document.getElementById('thickness');
    const productImageElem = document.getElementById('productImage');

    const relatedOemsBody = document.getElementById('relatedOemsBody');
    const compatibilitiesBody = document.getElementById('compatibilitiesBody');

    // Evento de búsqueda
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toUpperCase();
        console.log('Consulta ingresada:', query);

        if (query) {
            // Buscar por número OEM
            let oemFound = null;
            for (const part of data) {
                const oem = part.oems.find(o => o.numero_oem.toUpperCase() === query);
                if (oem) {
                    oemFound = { part, oem };
                    break;
                }
            }

            // Si no se encuentra por OEM, buscar por ID de parte
            let partFound = data.find(part => part.id.toUpperCase() === query);

            if (oemFound || partFound) {
                const selectedPart = oemFound ? oemFound.part : partFound;
                console.log('Pieza encontrada:', selectedPart);
                displayPartData(selectedPart);
                statusMessage.style.display = 'none';
            } else {
                console.log('No se encontró ninguna pieza con ese código.');
                // Mostrar mensaje de no encontrado
                statusMessage.textContent = 'No se encontró ninguna pieza con ese código.';
                statusMessage.style.display = 'block';
                clearPartData();
            }
        } else {
            // Limpiar datos si no hay búsqueda
            clearPartData();
            statusMessage.style.display = 'none';
        }
    });

    function displayPartData(part) {
        // Mostrar imagen
        productImageElem.style.backgroundImage = `url(${part.imagen})`;
        productImageElem.style.backgroundSize = 'contain';
        productImageElem.style.backgroundPosition = 'center';
        productImageElem.style.backgroundRepeat = 'no-repeat';

        // Mostrar datos principales
        partNumberElem.textContent = part.id;
        materialElem.textContent = part.materiales.map(m => m.tipo).join(', ');
        axisElem.textContent = part.eje || '-'; // Actualizado
        heightElem.textContent = part.alto || part.altura_interna || '-';
        widthElem.textContent = part.ancho || '-';
        thicknessElem.textContent = part.espesor || '-';

        // Mostrar OEMs relacionados
        relatedOemsBody.innerHTML = '';
        part.oems.forEach(oem => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${oem.numero_oem}</td><td>${oem.marca}</td>`;
            relatedOemsBody.appendChild(row);
        });

        // Mostrar compatibilidades
        compatibilitiesBody.innerHTML = '';
        part.compatibilidades.forEach(comp => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${comp.marca}</td><td>${comp.modelo}</td><td>${comp.motor}</td><td>${comp.años}</td>`;
            compatibilitiesBody.appendChild(row);
        });
    }

    function clearPartData() {
        productImageElem.style.backgroundImage = 'none';
        partNumberElem.textContent = '-';
        materialElem.textContent = '-';
        axisElem.textContent = '-'; // Actualizado
        heightElem.textContent = '-';
        widthElem.textContent = '-';
        thicknessElem.textContent = '-';
        relatedOemsBody.innerHTML = '';
        compatibilitiesBody.innerHTML = '';
    }
}
