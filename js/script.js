const sayfaCss = {
  "movies.html":  "css/movies.css",
  "seats.html":   "css/seats.css",
  "payment.html": "css/payment.css",
};

function sayfaCssYenile(url) {
  return new Promise((resolve) => {
    const sayfaAdi = url.split("/").pop() || "movies.html";
    const yeniCss = sayfaCss[sayfaAdi];
    
    if (!yeniCss) return resolve();

    const mevcutLinkler = document.querySelectorAll('link[data-sayfa-css]');

    const yeniLink = document.createElement("link");
    yeniLink.rel = "stylesheet";
    yeniLink.href = yeniCss;
    yeniLink.dataset.sayfaCss = "true";

    yeniLink.onload = () => {
      mevcutLinkler.forEach(eskiLink => eskiLink.remove());
      resolve();
    };

    document.head.appendChild(yeniLink);
  });
}

function icerigiYukle(url, addHistory = true) {
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
        sayfaCssYenile(url).then(() => {
          mainContainer.innerHTML = newMain.innerHTML;
          mainContainer.className = newMain.className;

          if (addHistory) {
            history.pushState({ path: url }, "", url);
          }

          menuGuncelle();
          sayfaBaslat();
        });
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

  const paymentSummary = document.querySelector(".payment-summary");
  if (paymentSummary) {
    odemeBaslat(paymentSummary);
  }

  const seats = document.querySelector(".seats");
  if (seats) {
    koltukBaslat();
  }
}


function odemeBaslat(paymentSummary) {
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

  const cardNumberInput = document.getElementById("card-number");
  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", () => {
      let val = cardNumberInput.value.replace(/\D/g, "").slice(0, 16);
      cardNumberInput.value = val.match(/.{1,4}/g)?.join(" ") || val;
    });
  }

  const expiryInput = document.getElementById("expiry-date");
  if (expiryInput) {
    expiryInput.addEventListener("input", () => {
      let val = expiryInput.value.replace(/\D/g, "").slice(0, 4);
      expiryInput.value = val.length >= 2 ? val.slice(0, 2) + "/" + val.slice(2) : val;
    });
  }

  const cvvInput = document.getElementById("cvv");
  if (cvvInput) {
    cvvInput.addEventListener("input", () => {
      cvvInput.value = cvvInput.value.replace(/\D/g, "").slice(0, 3);
    });
  }

  const cardholderInput = document.getElementById("cardholder-name");

  const telefonNo = document.getElementById("phone");
  if (telefonNo) {
    telefonNo.addEventListener("input", () => {
      telefonNo.value = telefonNo.value.replace(/\D/g, "").slice(0, 10);
    });
  }

  const odemeButon = document.getElementById("pay-button");
  if (odemeButon) {
    odemeButon.addEventListener("click", () => {
      const ad = cardholderInput?.value.trim() || "";
      const kartNo = cardNumberInput?.value.replace(/\s/g, "") || "";
      const sonKullanma = expiryInput?.value || "";
      const cvv = cvvInput?.value || "";

      if (ad.length < 3) {
        alert("Lütfen kart sahibinin adını giriniz.");
        return;
      }
      if (kartNo.length !== 16) {
        alert("Kart numarası 16 haneli olmalıdır.");
        return;
      }

      const [ay, yil] = sonKullanma.split("/");
      if (!ay || !yil || yil.length !== 2) {
        alert("Son kullanma tarihi AA/YY formatında olmalıdır.");
        return;
      }
      const buAy = new Date().getMonth() + 1;
      const buYil = new Date().getFullYear() % 100;
      if (parseInt(yil) < buYil || (parseInt(yil) === buYil && parseInt(ay) < buAy)) {
        alert("Kartınızın son kullanma tarihi geçmiş.");
        return;
      }

      if (cvv.length !== 3) {
        alert("CVV 3 haneli olmalıdır.");
        return;
      }

      smsModelAc();
    });
  }
}

function koltukBaslat() {
  const secilenKoltuklar = [];
  const koltukSecButon = document.getElementById("choose-button");
  const doluKoltuklar = ["A2", "B4", "C1", "E8", "F3"];

  if (koltukSecButon) koltukSecButon.disabled = true;

  function butonGuncelle() {
    if (!koltukSecButon) return;
    if (secilenKoltuklar.length > 0) {
      koltukSecButon.disabled = false;
      koltukSecButon.classList.add("active");
    } else {
      koltukSecButon.disabled = true;
      koltukSecButon.classList.remove("active");
    }
  }

  document.querySelectorAll(".seat-column a").forEach((koltuk) => {
    const sutunHarfi = koltuk.closest(".columns").querySelector(".row-label").textContent.trim();
    const numara = koltuk.querySelector("span").textContent.trim();
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

  if (koltukSecButon) {
    koltukSecButon.addEventListener("click", () => {
      window.location.href = "payment.html";
    });
  }
}


function smsModelAc() {
  const model = document.getElementById("sms-model");
  model.classList.add("acik");

  const smsKodInput = document.getElementById("sms-kod");
  const smsHata = document.getElementById("sms-hata");

  smsKodInput.addEventListener("input", () => {
    smsKodInput.value = smsKodInput.value.replace(/\D/g, "").slice(0, 6);
  });

  document.getElementById("sms-iptal").addEventListener("click", () => {
    model.classList.remove("acik");
    smsKodInput.value = "";
    smsHata.textContent = "";
  });

  document.getElementById("sms-onayla").addEventListener("click", () => {
    if (smsKodInput.value !== "123456") {
      smsHata.textContent = "Hatalı kod. Lütfen tekrar deneyiniz.";
      return;
    }

    model.classList.remove("acik");
    alert("Ödeme işlemi başarılı! İyi seyirler!");
    localStorage.removeItem("seciliFilm");
    localStorage.removeItem("seciliSeans");
    localStorage.removeItem("seciliKoltuklar");
    localStorage.removeItem("seciliTarih");
    window.location.href = "movies.html";
  });
}

const gunIsmi = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function tarihEtiketi(date) {
  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran","Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  return `${date.getDate()} ${aylar[date.getMonth()]}`;
}

//xxxx-xx-xx
function tarihAnahtari(date) { 
  const yil = date.getFullYear();
  const ay = String(date.getMonth() + 1).padStart(2, '0');
  const gun = String(date.getDate()).padStart(2, '0');
  
  return `${yil}-${ay}-${gun}`;
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

    if (anahtar === aktifTarih) a.classList.add("secili-tarih");
    if (!filmData[anahtar]) a.classList.add("tarih-bos");

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

  const filmler = filmData[tarih];

  liste.innerHTML = filmler
    .map(
      (film) => `
        <section class="ticket-section">
          <a href="${film.trailer}" class="image-link" target="_blank">
            <img class="float-resim" src="${film.resim}" alt="${film.alt}" loading="lazy" >
          </a>

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
            <aside class="film-info">
              <section class="film-info-1">
                <strong>Kategori: </strong>
                <span>${film.kategori}</span>
              </section>
              <section class="film-info-2">
                <strong>Süre: </strong>
                <span>${film.sure}</span>
              </section>
            </aside>
            <aside class="film-meta">
              <section class="film-meta-1">
                <strong>Yönetmen: </strong>
                <span>${film.yonetmen}</span>
              </section>
              <section class="film-meta-2">
                <strong>Oyuncular: </strong>
                <span>${film.oyuncular.join(", ")}</span>
              </section>
            </aside>
            <section class="film-meta-2">
              <strong>Konu: </strong>
              <span>${film.aciklama}</span>
            </section>
          </section>
        </section>
      `,
    )
    .join("");
}

document.addEventListener("click", (e) => {
  const timeLink = e.target.closest(".times-area a");
  if (timeLink) {
    const movieTitle = timeLink
      .closest(".ticket-section")
      .querySelector(".movie-title h1")
      .textContent.trim();
    const saat = timeLink.textContent.trim();
    localStorage.setItem("seciliFilm", movieTitle);
    localStorage.setItem("seciliSeans", saat);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (!history.state) {
    history.replaceState(
      { path: window.location.pathname },
      "",
      window.location.pathname
    );
  }

  document.querySelectorAll(".menu a").forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = link.getAttribute("href");
      if (target && !target.startsWith("http")) {
        e.preventDefault();
        icerigiYukle(target);
      }
    });
  });

  menuGuncelle();
  sayfaBaslat();
});

// F5'te movies.html'e yönlendir
window.addEventListener("load", () => {
  const performans = performance.getEntriesByType("navigation")[0];
  if (performans.type === "reload") {
    window.location.href = "movies.html";
  }
});

// Tarayıcı geri/ileri tuşu
window.addEventListener("popstate", (e) => {
  if (e.state && e.state.path) {
    const hedef = e.state.path.split("/").pop();
    const simdiki = window.location.pathname.split("/").pop();

    if (hedef === "payment.html" || simdiki === "payment.html") {
      window.location.href = "movies.html";
      return;
    }

    icerigiYukle(e.state.path, false);
  }
});