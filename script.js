document.addEventListener('DOMContentLoaded', function() {
    const menuGrid = document.getElementById('menuGrid');

    // _tab 파일명만 검색하여 메뉴 항목으로 추가
    const features = [
        { name: "문자열 개수 카운트", file: "count_tab.html" },
        { name: "파일 검색 및 이동", file: "deletedormove_tab.html" },
        { name: "파일 정보 검색", file: "FileInfo_tab.html" }
    ];

    features.forEach(feature => {
        const link = document.createElement('a');
        link.href = feature.file;
        link.className = 'grid-item';
        link.textContent = feature.name;

        menuGrid.appendChild(link);
    });
});
