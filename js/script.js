document.addEventListener('DOMContentLoaded', () => {

    const input = document.getElementById('raw-input');
    const inputView = document.getElementById('input-view');
    const readerView = document.getElementById('reader-view');
    const cleanContent = document.getElementById('clean-content');
    const archiveList = document.getElementById('archive-list');
    const saveBtn = document.getElementById('save-btn');

    loadArchive();

    if(localStorage.getItem('zenTheme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    window.processContent = () => {
        const raw = input.value;
        if (!raw.trim()) return alert("Please paste content first!");

        const paragraphs = raw.split(/\n+/);
        const formattedHTML = paragraphs
            .map(p => p.trim())
            .filter(p => p.length > 0)
            .map(p => `<p>${p}</p>`)
            .join('');

        cleanContent.innerHTML = formattedHTML;

        updateDashboard(raw);

        inputView.classList.add('hidden');
        readerView.classList.remove('hidden');
        saveBtn.classList.remove('hidden');
    };

    function updateDashboard(text) {
        const wordCount = text.trim().split(/\s+/).length;
        document.getElementById('stat-words').innerText = wordCount;
        document.getElementById('stat-time').innerText = Math.ceil(wordCount / 200) + "m";

        const sentences = text.split('.');
        let summary = sentences.slice(0, 6).join('. ') + ".";

        if (summary.length < 10) summary = text;

        document.getElementById('ai-summary').innerText = summary;
    }

    window.saveArticle = () => {
        const entry = {
            id: Date.now(),
            title: cleanContent.innerText.substring(0, 25) + "...",
            content: cleanContent.innerHTML
        };

        const archive = JSON.parse(localStorage.getItem('zenArchive') || '[]');
        archive.unshift(entry);
        localStorage.setItem('zenArchive', JSON.stringify(archive));

        alert("Article saved to library!");
        loadArchive();
    };

    window.resetApp = () => {
        input.value = "";
        inputView.classList.remove('hidden');
        readerView.classList.add('hidden');
        saveBtn.classList.add('hidden');
        document.getElementById('ai-summary').innerText = "Waiting for content...";
        document.getElementById('stat-words').innerText = "0";
        document.getElementById('stat-time').innerText = "0m";
    };

    window.toggleTheme = () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('zenTheme', isDark ? 'dark' : 'light');
    };

    function loadArchive() {
        const archive = JSON.parse(localStorage.getItem('zenArchive') || '[]');
        archiveList.innerHTML = "";

        if (archive.length === 0) {
            archiveList.innerHTML = "<div style='color:var(--text-muted); text-align:center; margin-top:20px; font-size:0.9rem'>No saved items</div>";
            return;
        }

        archive.forEach(item => {
            const div = document.createElement('div');
            div.className = 'archive-item';

            div.innerHTML = `
                <span style="flex:1; overflow:hidden; text-overflow:ellipsis;">${item.title}</span>
                <button class="delete-btn" onclick="deleteArticle(event, ${item.id})">&times;</button>
            `;

            div.onclick = (e) => {
                if(e.target.classList.contains('delete-btn')) return;

                cleanContent.innerHTML = item.content;
                inputView.classList.add('hidden');
                readerView.classList.remove('hidden');
                saveBtn.classList.add('hidden');

                updateDashboard(cleanContent.innerText);
            };

            archiveList.appendChild(div);
        });
    }

    window.deleteArticle = (e, id) => {
        e.stopPropagation();

        if(confirm("Delete this article?")) {
            let archive = JSON.parse(localStorage.getItem('zenArchive') || '[]');
            archive = archive.filter(item => item.id !== id);
            localStorage.setItem('zenArchive', JSON.stringify(archive));
            loadArchive();
        }
    };

    document.addEventListener('dblclick', async (e) => {
        const selection = window.getSelection().toString().trim();
        if (selection && selection.length > 2) {
            try {
                const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${selection}`);
                const data = await res.json();
                if(data[0]) {
                    const def = data[0].meanings[0].definitions[0].definition;
                    alert(`📖 ${selection.toUpperCase()}:\n\n${def}`);
                }
            } catch (err) {}
        }
    });

});
