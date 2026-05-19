function loadContent(url, addHistory = true) {
  const mainContainer = document.querySelector("main");

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("Sayfa bulunamadı");
      return res.text();
    })
    .then((data) => {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(data, "text/html");
      const newMain = htmlDoc.querySelector("main");

      if (newMain) {
        mainContainer.innerHTML = newMain.innerHTML;
        mainContainer.className = newMain.className;

        if (addHistory) {
          history.pushState({ path: url }, "", url);
        }

        menuGuncelle();
        sayfaBaslat();
      }
    })
    .catch((err) => console.error("Yükleme hatası:", err));
}

function menuGuncelle() {
  const sayfaAdi = window.location.pathname.split("/").pop() || "movies.html";

  const menuLinks = {
    "movies.html": document.querySelector('.menu a[href="movies.html"]'),
    "seats.html": document.querySelector('.menu a[href="seats.html"]'),
    "payment.html": document.querySelector('.menu a[href="payment.html"]'),
  };

  const sira = ["movies.html", "seats.html", "payment.html"];
  const aktifIndex = sira.indexOf(sayfaAdi);

  sira.forEach((sayfa, i) => {
    const link = menuLinks[sayfa];
    if (!link) return;

    link.classList.remove("aktif", "tamamlandi", "kilitli");

    if (i < aktifIndex) {
      link.classList.add("tamamlandi");
    } else if (i === aktifIndex) {
      link.classList.add("aktif");
    } else {
      link.classList.add("kilitli");
    }
  });
}

function sayfaBaslat() {
  if (document.getElementById("date-area")) {
    const bugunAnahtari = tarihAnahtari(new Date());
    const aktifTarih = localStorage.getItem("seciliTarih") || bugunAnahtari;
    localStorage.setItem("seciliTarih", aktifTarih);
    dateAreaOlustur();
    filmListesiOlustur(aktifTarih);
  }

  // Payment sayfası
  const paymentSummary = document.querySelector(".payment-summary");
  if (paymentSummary) {
    const film = localStorage.getItem("seciliFilm") || "—";
    const seans = localStorage.getItem("seciliSeans") || "—";
    const koltuk = localStorage.getItem("seciliKoltuklar") || "—";

    paymentSummary.innerHTML = `
      <h2>Ödeme Özeti</h2>
      <p>Film: ${film}</p>
      <p>Seans: ${seans}</p>
      <p>Koltuk: ${koltuk}</p>
      <h3>Toplam Tutar: ${koltuk.split(",").length * 300} TL</h3>
    `;
  }

  // Seats sayfası
  if (document.querySelector(".seats")) {
    const secilenKoltuklar = [];
    const odemeButon = document.getElementById("choose-button");
    const doluKoltuklar = ["A2", "B4", "C1", "F3", "G7"];

    if (odemeButon) odemeButon.disabled = true;

    function butonGuncelle() {
      if (!odemeButon) return;
      if (secilenKoltuklar.length > 0) {
        odemeButon.disabled = false;
        odemeButon.classList.add("active");
      } else {
        odemeButon.disabled = true;
        odemeButon.classList.remove("active");
      }
    }

    document.querySelectorAll(".seat-column a").forEach((koltuk) => {
      const sutunHarfi = koltuk.closest(".columns").querySelector("h2").textContent.trim();
      const numara = koltuk.querySelector("h2").textContent.trim();
      const koltukAdi = sutunHarfi + numara;

      if (doluKoltuklar.includes(koltukAdi)) {
        koltuk.classList.add("occupied");
        return;
      }

      koltuk.addEventListener("click", (e) => {
        e.preventDefault();

        if (koltuk.classList.contains("selected")) {
          koltuk.classList.remove("selected");
          secilenKoltuklar.splice(secilenKoltuklar.indexOf(koltukAdi), 1);
        } else {
          koltuk.classList.add("selected");
          secilenKoltuklar.push(koltukAdi);
        }

        localStorage.setItem("seciliKoltuklar", secilenKoltuklar.join(", "));
        butonGuncelle();
      });
    });

    if (odemeButon) {
      odemeButon.addEventListener("click", () => {
        window.location.href = "payment.html";
      });
    }
  }
}

document.addEventListener("click", (e) => {
  const timeLink = e.target.closest(".times-area a");
  if (timeLink) {
    const movieTitle = timeLink.closest(".ticket-section").querySelector(".movie-title h2").textContent.trim();
    const saat = timeLink.textContent.trim();
    localStorage.setItem("seciliFilm", movieTitle);
    localStorage.setItem("seciliSeans", saat);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (!history.state) {
    history.replaceState({ path: window.location.pathname }, "", window.location.pathname);
  }

  document.querySelectorAll(".menu a").forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = link.getAttribute("href");
      if (target && !target.startsWith("http")) {
        e.preventDefault();
        loadContent(target);
      }
    });
  });

  menuGuncelle();
  sayfaBaslat();
});

window.addEventListener("popstate", (e) => {
  if (e.state && e.state.path) {
    loadContent(e.state.path, false);
  }
});

const gunIsmi = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function tarihEtiketi(date) {
  return `${date.getDate()} ${["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"][date.getMonth()]}`;
}

function tarihAnahtari(date) {
  return date.toISOString().split("T")[0]; // "xxxx-xx-xx"
}

function dateAreaOlustur() {
  const dateArea = document.getElementById("date-area");
  if (!dateArea) return;

  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);

  dateArea.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const gun = new Date(bugun);
    gun.setDate(bugun.getDate() + i);

    const anahtar = tarihAnahtari(gun);
    const aktifTarih = localStorage.getItem("seciliTarih") || tarihAnahtari(bugun);

    const a = document.createElement("a");
    a.href = "#";
    a.dataset.tarih = anahtar;
    a.innerHTML = `
      <div class="day"><h3>${tarihEtiketi(gun)}</h3></div>
      <div class="week">${gunIsmi[gun.getDay()]}</div>
    `;

    if (anahtar === aktifTarih) {
      a.classList.add("secili-tarih");
    }

    // Veri yoksa soluk göster
    if (!filmVerisi[anahtar]) {
      a.classList.add("tarih-bos");
    }

    a.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.setItem("seciliTarih", anahtar);
      dateArea.querySelectorAll("a").forEach((el) => el.classList.remove("secili-tarih"));
      a.classList.add("secili-tarih");
      filmListesiOlustur(anahtar);
    });

    dateArea.appendChild(a);
  }
}

function filmListesiOlustur(tarih) {
  const liste = document.getElementById("film-list");
  if (!liste) return;

  const filmler = filmVerisi[tarih];

  liste.innerHTML = filmler
    .map(
      (film) => `
    <section class="ticket-section">
      <a href="${film.trailer}" class="image-link" target="_blank"> <img class="float-resim" src="${film.resim}" alt="${film.alt}"></a>

      <article class="time-row-section">
        <header class="movie-title">
        <h1>${film.baslik}</h1>

        </header>
        <section class="time-row-list">
          ${film.turler
            .map(
              (tur) => `
            <section class="cinema-detail">
              <section class="into-text cinema-detail-tech-text">
                <strong>${tur.ad}</strong>
              </section>
              <section class="times-area">
                ${tur.saatler.map((saat) => `<a href="seats.html">${saat}</a>`).join("")}
              </section>
            </section>
          `,
            )
            .join("")}
        </section>
      </article>

      <section class="description-section">
        <div class="film-meta">
          <span> ${film.kategori}</span>
          <span> ${film.sure}</span>
        </div>
        <p>${film.aciklama}</p>
      </section>
    </section> 
  `,
    )
    .join("");
}

const odemeButon = document.getElementById("pay-button");









const filmVerisi = {
  "2026-05-18": [
    {
      baslik: "Avatar: Fire and Ash",
      resim: "media/AVATAR.jpg",
      trailer: "https://youtu.be/nb_fFj_0rq8?si=zu7TA4vbWDHLrg4S",
      alt: "Avatar: Fire and Ash",
      aciklama: "Avatar: Fire and Ash, James Cameron'ın yönettiği bir bilim kurgu filmidir. Pandora gezegeninde geçer ve Na'vi halkının yaşamını konu alır.",
      kategori: "Bilim Kurgu, Macera, Aksiyon",
      sure: "162 dk",
      turler: [
        { ad: "2D - ALTYAZILI", saatler: ["9:30", "12:30", "15:30", "18:30", "21:30"] },
        { ad: "2D - DUBLAJ", saatler: ["9:25", "10:30", "12:00", "14:45", "17:00"] },
        { ad: "3D - DUBLAJ", saatler: ["9:00", "11:30", "15:00", "19:45"] },
      ],
    },
    {
      baslik: "Hamnet",
      resim: "media/Hamnet.jpg",
      trailer: "https://youtu.be/xYcgQMxQwmk?si=_gzsLjHKbOqB6pUZ",
      alt: "Hamnet",
      aciklama: "William Shakespeare'in oğlu Hamnet'in hayatını konu alan biyografik bir drama filmidir.",
      kategori: "Drama, Tarih",
      sure: "120 dk",
      turler: [
        { ad: "2D - ALTYAZILI", saatler: ["9:30", "12:30", "15:30", "18:30", "21:30"] },
        { ad: "2D - DUBLAJ", saatler: ["9:25", "10:30", "12:00", "14:45", "17:00"] },
      ],
    },
    {
      baslik: "Doctor Strange",
      resim: "media/drStrange.jpg",
      trailer: "https://youtu.be/Lt-U_t2pUHI?si=MLZP0mchkkwu6LB3",
      alt: "Doctor Strange",
      aciklama: "Marvel Comics karakteri Doctor Stephen Strange'in maceralarını konu alan süper kahraman filmidir.",
      kategori: "Bilim Kurgu, Aksiyon, Fantastik",
      sure: "120 dk",
      turler: [
        { ad: "2D - ALTYAZILI", saatler: ["9:30", "12:30", "15:30", "18:30", "21:30"] },
        { ad: "3D - DUBLAJ", saatler: ["9:00", "11:30", "15:00", "19:45"] },
      ],
    },
  ],
  "2026-05-19": [
    {
      baslik: "Doctor Strange",
      resim: "media/drStrange.jpg",
      trailer: "https://youtu.be/Lt-U_t2pUHI?si=MLZP0mchkkwu6LB3",
      alt: "Doctor Strange",
      aciklama: "Marvel Comics karakteri Doctor Stephen Strange'in maceralarını konu alan süper kahraman filmidir.",
      kategori: "Bilim Kurgu, Aksiyon, Fantastik",
      sure: "120 dk",
      turler: [
        { ad: "2D - DUBLAJ", saatler: ["10:00", "13:00", "16:00", "19:00"] },
        { ad: "3D - DUBLAJ", saatler: ["11:00", "14:00", "18:00", "21:00"] },
      ],
    },
    {
      baslik: "Hamnet",
      resim: "media/Hamnet.jpg",
      trailer: "https://youtu.be/xYcgQMxQwmk?si=_gzsLjHKbOqB6pUZ",
      alt: "Hamnet",
      aciklama: "William Shakespeare'in oğlu Hamnet'in hayatını konu alan biyografik bir drama filmidir.",
      kategori: "Drama, Tarih",
      sure: "120 dk",
      turler: [{ ad: "2D - ALTYAZILI", saatler: ["9:00", "12:00", "15:00", "18:00"] }],
    },
  ],
  "2026-05-20": [
    {
      baslik: "Avatar: Fire and Ash",
      resim: "media/AVATAR.jpg",
      trailer: "https://youtu.be/nb_fFj_0rq8?si=zu7TA4vbWDHLrg4S",
      alt: "Avatar: Fire and Ash",
      aciklama: "Avatar: Fire and Ash, James Cameron'ın yönettiği bir bilim kurgu filmidir.",
      kategori: "Bilim Kurgu, Macera, Aksiyon",
      sure: "162 dk",
      turler: [
        { ad: "2D - ALTYAZILI", saatler: ["10:00", "13:30", "17:00", "20:30"] },
        { ad: "3D - DUBLAJ", saatler: ["11:00", "15:00", "19:00"] },
      ],
    },
  ],
};
