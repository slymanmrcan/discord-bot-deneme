# Telegram Bot Yöneticisi

Bu proje, Telegram botlarını yönetmek için kullanılan web tabanlı bir arayüzdür. Kullanıcılar bu arayüz üzerinden birden fazla Telegram botunu yönetebilir, mesaj gönderebilir ve alabilirler.

## Özellikler

- **Çoklu Bot Desteği**: Birden fazla Telegram botunu aynı arayüzden yönetin
- **Mesajlaşma**: Seçilen sohbetlere metin mesajları gönderin
- **Medya Paylaşımı**: Resim, video ve belge gibi medya dosyalarını paylaşın
- **Grup Yönetimi**: Grup sohbetlerini yönetin
- **Yerel Depolama**: Bot bilgileri ve mesaj geçmişi tarayıcıda saklanır
- **Kullanıcı Dostu Arayüz**: Modern ve kullanımı kolay arayüz

## Kurulum

1. Bu projeyi bilgisayarınıza klonlayın veya indirin
2. `index.html` dosyasını bir web tarayıcısında açın
3. Herhangi bir sunucuya yüklemenize gerek yok, doğrudan çalışır

## Kullanım

1. **Bot Ekleme**:
   - Sol taraftaki "Yeni Bot Ekle" bölümünden bot token'ınızı girin
   - Botunuz için bir isim verin
   - "Bot Ekle" butonuna tıklayın

2. **Bot Seçme**:
   - Sol taraftaki listeden yönetmek istediğiniz botu seçin

3. **Mesaj Gönderme**:
   - Sağ alt köşedeki metin kutusuna mesajınızı yazın
   - Göndermek için "Gönder" butonuna tıklayın veya Enter tuşuna basın

4. **Medya Gönderme**:
   - "Dosya Seç" butonuna tıklayarak bir medya dosyası seçin
   - İsteğe bağlı olarak bir açıklama metni ekleyin
   - "Gönder" butonuna tıklayın

5. **Sohbet Seçme**:
   - "Sohbet Seç" bölümünden bir sohbet seçin
   - Eğer sohbetler görünmüyorsa, "Sohbetleri Getir" butonuna tıklayın

## Gereksinimler

- Modern bir web tarayıcısı (Chrome, Firefox, Edge, Safari vb.)
- İnternet bağlantısı (Telegram API'sine erişim için)
- Telegram bot token'ı

## Yerel Depolama

Uygulama, aşağıdaki bilgileri tarayıcınızın yerel depolama alanında saklar:
- Eklenen botların token ve isim bilgileri
- Mesaj geçmişi
- Son seçilen bot ve sohbet bilgileri

## Güvenlik Notları

- Bot token'larınız sadece sizin tarayıcınızda saklanır
- Token'larınızı kimseyle paylaşmayın
- Güvenlik için herkese açık bilgisayarlarda kullanmaktan kaçının

## Geliştirme

Bu proje şu teknolojileri kullanmaktadır:
- HTML5
- CSS3 (Flexbox ve Grid)
- JavaScript (ES6+)
- Telegram Bot API

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
