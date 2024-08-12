let selectedFiles = [];
let searchResults = [];
const itemsPerPage = 100; // 페이지당 항목 수
let currentPage = 1;
let sortColumn = "fileName"; // 기본 정렬 기준
let sortOrder = "asc"; // 기본 정렬 순서

// 폴더 선택 버튼 클릭 시 파일 선택 창 열기
document.getElementById('selectFolderTrigger').addEventListener('click', () => {
    document.getElementById('selectFolderBtn').click();
});

// 폴더 선택 시 파일 목록을 저장하고 선택한 폴더의 경로까지만 표시
document.getElementById('selectFolderBtn').addEventListener('change', (event) => {
    selectedFiles = Array.from(event.target.files).filter(file => file.name.endsWith('.json')); // .json 파일 필터링
    if (selectedFiles.length > 0) {
        const fullPath = selectedFiles[0].webkitRelativePath;
        const folderPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
        document.getElementById('selectedFolder').textContent = `검색 폴더: ${folderPath}`;
    } else {
        document.getElementById('selectedFolder').textContent = '검색 폴더: 선택되지 않음';
    }
});

// 검색 버튼 클릭 시 파일 검색 수행
document.getElementById('searchBtn').addEventListener('click', () => {
    const regexPattern = document.getElementById('regexPattern').value;
    
    if (selectedFiles.length === 0 || !regexPattern) {
        alert('검색 폴더와 정규식 패턴을 모두 입력해야 합니다.');
        return;
    }

    const regex = new RegExp(regexPattern, 'g');
    searchResults = [];
    currentPage = 1;

    // Loading 메시지 표시
    const loadingMessage = document.getElementById('loadingMessage');
    const estimatedTime = document.getElementById('estimatedTime');
    loadingMessage.style.display = 'block';
    const startTime = new Date();

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const matchCount = (content.match(regex) || []).length;
            if (matchCount > 0) {
                searchResults.push({ fileName: file.name, count: matchCount, file }); // 파일 객체를 searchResults에 저장
            }

            // 예상 시간 업데이트
            const elapsedTime = new Date() - startTime;
            const estimatedTotalTime = (elapsedTime / (index + 1)) * selectedFiles.length;
            const remainingTime = estimatedTotalTime - elapsedTime;
            estimatedTime.textContent = `남은 시간: ${Math.round(remainingTime / 1000)}초`;

            if (index === selectedFiles.length - 1) {
                loadingMessage.style.display = 'none'; // Loading 메시지 숨기기
                displayResults();
            }
        };
        reader.readAsText(file);
    });
});

// 페이지네이션 버튼 생성
function createPaginationControls() {
    const totalPages = Math.ceil(searchResults.length / itemsPerPage);
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.innerHTML = ''; // 기존 페이지네이션 버튼 제거

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            displayResults();
        });
        paginationControls.appendChild(pageButton);
    }
}

// 정렬 기준과 순서 변경 시 호출되는 함수
function updateSortOrder(newSortColumn, newSortOrder) {
    sortColumn = newSortColumn;
    sortOrder = newSortOrder;
    displayResults(); // 새로운 정렬 기준으로 결과 표시
}

//파일 이름 기준 정렬
function customSort(a, b) {
    let comparison = 0;

    if (sortColumn === "fileName") {
        const regex = /(\d+)|(\D+)/g;
        const partsA = a.fileName.toLowerCase().match(regex);
        const partsB = b.fileName.toLowerCase().match(regex);

        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            if (!partsA[i]) return sortOrder === 'asc' ? -1 : 1;
            if (!partsB[i]) return sortOrder === 'asc' ? 1 : -1;

            const isNumA = !isNaN(partsA[i]);
            const isNumB = !isNaN(partsB[i]);

            if (isNumA && isNumB) {
                const numA = parseInt(partsA[i], 10);
                const numB = parseInt(partsB[i], 10);
                if (numA !== numB) {
                    comparison = sortOrder === 'asc' ? numA - numB : numB - numA;
                    break;
                }
            } else {
                comparison = partsA[i].localeCompare(partsB[i]);
                if (comparison !== 0) {
                    return sortOrder === 'asc' ? comparison : -comparison;
                }
            }
        }
    } else if (sortColumn === "count") {
        comparison = sortOrder === 'asc' ? a.count - b.count : b.count - a.count;
    } else {
        comparison = sortOrder === 'asc'
            ? a[sortColumn] > b[sortColumn] ? 1 : -1
            : a[sortColumn] < b[sortColumn] ? 1 : -1;
    }

    if (comparison === 0 && sortColumn !== "fileName") {
        return a.fileName.localeCompare(b.fileName);
    }

    return comparison;
}

// 결과 테이블에 데이터 표시 (페이지별)
function displayResults() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, searchResults.length);

    searchResults.sort(customSort);

    const tbody = document.querySelector('#resultTable tbody');
    tbody.innerHTML = ''; // 기존 내용 삭제

    for (let i = startIndex; i < endIndex; i++) {
        const result = searchResults[i];
        const row = document.createElement('tr');

        const checkCell = document.createElement('td');
        const checkBox = document.createElement('input');
        checkBox.type = 'checkbox';
        checkBox.dataset.index = i;
        checkCell.appendChild(checkBox);
        row.appendChild(checkCell);

        const noCell = document.createElement('td');
        noCell.textContent = i + 1;
        row.appendChild(noCell);

        const fileNameCell = document.createElement('td');
        fileNameCell.textContent = result.fileName;
        row.appendChild(fileNameCell);

        const countCell = document.createElement('td');
        countCell.textContent = result.count;
        row.appendChild(countCell);

        tbody.appendChild(row);
    }

    createPaginationControls();
}

// 새로고침 버튼 클릭 시 호출되는 함수
function refreshResults() {
    displayResults(); // 현재 정렬 기준과 순서로 결과를 다시 표시
}

// 결과 초기화 버튼 클릭 시 테이블 초기화
document.getElementById('clearResultsBtn').addEventListener('click', () => {
    searchResults = [];
    document.querySelector('#resultTable tbody').innerHTML = '';
    document.getElementById('paginationControls').innerHTML = '';
    document.getElementById('selectedFolder').textContent = '검색 폴더: 선택되지 않음';
});

// 전체 선택 버튼 클릭 시 모든 체크박스 선택 (페이지 내)
document.getElementById('selectAllBtn').addEventListener('click', () => {
    document.querySelectorAll('#resultTable tbody input[type="checkbox"]').forEach(cb => cb.checked = true);
});

// 전체 해제 버튼 클릭 시 모든 체크박스 선택 해제 (페이지 내)
document.getElementById('deselectAllBtn').addEventListener('click', () => {
    document.querySelectorAll('#resultTable tbody input[type="checkbox"]').forEach(cb => cb.checked = false);
});

// 선택 삭제 버튼 클릭 시 선택된 파일 삭제
document.getElementById('deleteSelectedBtn').addEventListener('click', () => {
    const selected = [];
    document.querySelectorAll('#resultTable tbody input[type="checkbox"]:checked').forEach(cb => {
        selected.push(parseInt(cb.dataset.index));
    });

    searchResults = searchResults.filter((result, index) => {
        if (selected.includes(index)) {
            // 파일 삭제 로직
            const filePath = result.file.webkitRelativePath || result.file.name;
            window.resolveLocalFileSystemURL(filePath, function (fileEntry) {
                fileEntry.remove(function () {
                    console.log("File removed: " + filePath);
                }, function (error) {
                    console.error("Error removing file: " + filePath, error);
                });
            });
            return false; // 필터링으로 검색 결과에서 제외
        }
        return true;
    });

    displayResults();
});

// 새로고침 버튼 클릭 시 결과 갱신
document.getElementById('refreshBtn').addEventListener('click', displayResults);

// CSV 저장 버튼 클릭 시 결과를 CSV 파일로 저장 (한글 깨짐 방지)
document.getElementById('saveCsvBtn').addEventListener('click', () => {
    if (searchResults.length === 0) {
        alert('저장할 검색 결과가 없습니다.');
        return;
    }

    const csvContent = "\uFEFF" + "FileName,Count\n" // BOM(Byte Order Mark) 추가로 한글 깨짐 방지
        + searchResults.map(e => `"${e.fileName}",${e.count}`).join("\n");

    const now = new Date();
    const filename = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`
        + `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.csv`;

    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })));
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
