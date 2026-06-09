"""
Generate yeni-medya-final.json from extracted PDF text.
Run: python scripts/generate_yeni_medya.py
"""
import re, json, sys, os

sys.stdout.reconfigure(encoding='utf-8')

AI_SUMMARIES = {
1: "**Beceri-Risk Paradoksu**, dijital yetkinlik ile dijital risk arasındaki ilişkinin basit bir 'daha becerili = daha güvende' formülüne uymadığını gösterir. Becerili bireyler internette çok daha fazla alan keşfeder; dolayısıyla risk olasılıkları da doğal olarak artar.",
2: "**Gözetim Kapitalizmi** kavramıyla anılan bu süreçte algoritmalar, biyometrik ve davranışsal verilerle bireyin tercihlerini ve kararlarını şekillendirir. Birey seçim yaptığını sanır; aslında önceden profillenen bir kullanıcı olarak yönlendirilmektedir.",
3: "**Filtre Balonu** ve **Yankı Odası**, platform algoritmalarının etkileşimi artırmak amacıyla kullanıcıya sürekli benzer içerik göstermesinden doğar. Bu durum bireysel kutuplaşmayı besler ve toplumsal diyaloğu zayıflatır.",
4: "**İkincil Sözlülük** (secondary orality), Walter J. Ong'un tanımıyla yazı kültürünün teknolojik altyapısından beslenen ama sözlü kültürün anlık, katılımcı ve topluluk odaklı niteliklerini dijital ortamda yeniden üreten iletişim biçimidir. Emojiler, sesli mesajlar ve anlık paylaşımlar buna tipik örnektir.",
5: "**GAN** mimarisinde iki ağ yarışır: Üretici (Generator) sahte içerik üretir, Ayırt Edici (Discriminator) ise gerçeği sahteden ayırt etmeye çalışır. Bu çekişmeli öğrenme döngüsü modeli giderek daha ikna edici deepfake içerikler üretir hale getirir.",
6: "**Bağlamsal Suistimal**, gerçek bir bilginin içeriği değiştirilmeden ama bağlamından koparılarak başka bir anlam yüklenmesiyle yapılan yanıltıcı bir enformasyon türüdür. 'Gerçek ama bağlamından koparılmış' bilgi olarak özetlenebilir.",
7: "**Gözetim Kapitalizmi** kuramında (Zuboff) kullanıcının dijital faaliyetleri 'davranışsal artık' adı verilen ham maddeye dönüşür. Platform bu veriyi reklam verenlere satar; kullanıcı parasız kullandığını sanırken verisiyle ödeme yapar.",
8: "**Akış Teorisi** (Flow Theory, Csikszentmihalyi), kişinin yaptığı işe tamamen daldığı, zaman ve mekân algısını yitirdiği optimal deneyim durumunu tanımlar. Sosyal medyadaki sonsuz kaydırma (infinite scroll) bu zihin durumunu kolayca tetikler.",
9: "Yanlış bilgi türleri arasında **Mizenformasyon** (misinformation), kötü niyet olmaksızın yanlışlıkla yayılan bilgiyi ifade eder. Eski bir felaket fotoğrafını güncel sanarak paylaşmak buna klasik örnektir.",
10: "**Siber Kültür**, dijital ortamda kendiliğinden oluşan topluluk normlarını, jargonları, ritüelleri ve kimlik pratiklerini kapsar. Reddit kuralları, Discord sunucu normları ve TikTok trendleri internetin yalnızca teknik bir altyapı olmadığının kanıtıdır.",
11: "Adorno ve Horkheimer'ın **Kültür Endüstrisi** kavramı, kitle iletişim araçlarının kültürü seri üretimle standartlaştırarak eleştirel düşünceyi körelttiğini savunur. Popüler kültür 'fabrikasyon' yöntemiyle üretilmekte ve kitleleri pasifleştirmektedir.",
12: "**Problemli Medya Kullanımı Müdahale Planı**'nın dört adımı: Klinik Tarama, Yeniden Yapılandırma, Davranışsal Sınırlama ve Sürdürülebilirlik. Motivasyonel Görüşme geçerli bir terapötik yöntemdir ama bu planın dışındadır.",
13: "**Macro AI**, OpenAI GPT-5 veya Google Gemini 2.0 gibi bulut sunucularında çalışan, devasa enerji tüketen büyük dil modellerini tanımlar. Buna karşın **Nano/Edge AI**, cihaz üzerinde çalışan, internet gerektirmeyen küçük modellerdir.",
14: "Mark Deuze'nin **'Medya Yaşamı'** anlayışına göre medya artık bir araç değil içinde yaşanılan bir ortamdır. Sabah alarm uygulamasından gece podcast'e kadar medya görünmez biçimde gündelik deneyimin dokusuna işlemiştir.",
15: "**Etkileşimlilik** (interactivity), yeni medyanın geleneksel yayıncılıktan en temel farkıdır. Kullanıcılar artık yalnızca alıcı değil; yorum yapan, paylaşan, içerik üreten aktif bireylerdir.",
16: "**Dijital Uçurum** (digital divide), bireylerin ve toplumların internet, teknoloji ve dijital becerilere erişimdeki eşitsizlikleri ifade eder. Yalnızca fiziksel erişim değil, kullanım kalitesi ve beceri düzeyi de bu uçurumun boyutlarıdır.",
17: "**Onaylama Önyargısı** (confirmation bias), insanın kendi dünya görüşünü destekleyen bilgilere yönelip çelişenleri görmezden gelme eğilimidir. Filtre balonları bu psikolojik zaafı algoritmik olarak pekiştirir.",
18: "José van Dijck'in **Verileştirme** (datafication) kavramı, her beğeninin, her kaydırmanın ve her konumun ekonomik değere dönüştürülebilir veriye çevrilmesini ifade eder. 'Bedava' platform aslında verisiyle ödeme yapan kullanıcı sayesinde ayakta durur.",
19: "**Malenformasyon**, bilginin sahte değil gerçek olması ama kötü niyetle bağlamından koparılarak zarar vermek amacıyla kullanılmasıdır. 'Gerçek bilgi, yanlış amaç' olarak özetlenebilir.",
20: "**Verileştirme** (Datafication), Van Dijck'e göre insan davranışlarının ölçülebilir ve ticarileştirilebilir veri formlarına dönüştürülmesidir. Gözetim Kapitalizmi ise bu verinin nasıl sömürüldüğünü açıklar.",
21: "Transformer mimarisinin uzun metin işlemedeki sorunlarına yanıt olarak geliştirilen **Mamba** ve **Liquid Neural Networks**, çok düşük işlem gücüyle verimli çalışmayı hedefler. Bu modeller 'sonsuz hafıza' vaadi taşıyan yeni nesil alternatiflerdir.",
22: "**Ajan Sürüleri** (Agent Swarms), belirli bir hedefe ulaşmak için birden fazla yapay zekanın iş bölümü yaparak birbirini denetlediği Agentic Workflow mantığını ifade eder. Haber pipeline'ı bunun somut örneğidir.",
23: "Elizabeth Noelle-Neumann'ın **Suskunluk Sarmalı** kuramı, bireylerin azınlıkta kaldıklarını düşündüklerinde dışlanma korkusuyla fikirlerini ifade etmekten kaçındığını açıklar. Bu sessizleşme, baskın görüşü olduğundan daha güçlü gösterir.",
24: "McLuhan'a göre matbaanın harfleri düz bir çizgide sıralaması **Lineer Düşünce**'yi doğurmuştur. Neden-sonuç zinciri, sıralı mantık ve analitik akıl yürütme bu basılı kültürün zihinsel mirasıdır.",
25: "Marc Prensky'nin **Dijital Yerliler** (Digital Natives) kavramı, teknolojiyle büyüyen nesillerin onu sezgisel ve doğal biçimde kullandığını savunur. Dijital Göçmenler ise teknolojiyi sonradan öğrenenlerdir.",
26: "Ong'un ikincil sözlülüğü, Jenkins'in katılımcı kültürü ve Van Dijck'in platform mantığının aynı anda göründüğü en güçlü örnek **TikTok remix kültürü**dür: anlık sözlü etkileşim + kullanıcı üretimi + algoritmanın görünürlüğü bir arada.",
27: "Alvin Toffler'ın **Prosumer** (üretici-tüketici) kavramı, yeni medyada kullanıcının pasif alıcı konumundan çıkıp içerik üreten, paylaşan ve geri bildirim veren aktif bir özneye dönüştüğünü ifade eder.",
28: "Hem Google Gemini 2.0 hem de Claude 4 Opus bulut tabanlı **Macro AI** sistemleridir; dolayısıyla 'Macro AI vs Nano AI' karşıtlığına uygun bir eşleşme oluşturmazlar. Nano AI, cihazda çalışan modelleri ifade eder.",
29: "**Dijital Eşitsizlik**, bireylerin internet, bilgisayar ve dijital becerilere erişim açısından farklı fırsatlara sahip olmasıdır. Yalnızca internet bağlantısı değil; kullanım kalitesi ve beceri kapasitesi de bu eşitsizliğin boyutlarındandır.",
30: "Dijital iletişimin **beş yapısal sabiti**: etkileşimlilik, şeffaflık baskısı, hız, süreklilik (7/24) ve ölçülebilirlik. 'Editoryal denetim' ise geleneksel medyanın özelliğidir; dijital çağda yerini algoritmalara bırakmıştır.",
31: "Yanis Varoufakis'in **Teknofeodalizm** kavramına göre Amazon, Google gibi platformlar ürün üretmez; 'dijital derebeylik' gibi altyapıyı kontrol ederek komisyon alır. Bu, kapitalizmin kâr mantığından rant mantığına geçişidir.",
32: "Siyasetçinin söylemediği şeyleri söylüyormuş gibi gösteren deepfake, **Kasıtlı Aldatma – Manipüle Edilmiş** içerik kategorisine girer. 'Uydurma İçerik' tamamen hayali bir olay için kullanılır; burada gerçek kişi varsa 'manipüle' doğru terimdir.",
33: "Henry Jenkins'in **Katılımcı Kültür** (participatory culture) kavramı, kullanıcıların pasif tüketici olmak yerine içerik üreten, yeniden üreten ve dolaşıma sokan aktif katılımcılara dönüştüğü medya ortamını tanımlar.",
34: "Yeni medyanın temel özellikleri: sayısallık, **etkileşimlilik**, ağa bağlılık, hipermetinsellik ve çoklu ortam. 'Etkileşimsizlik' bunların tam tersidir ve geleneksel (tek yönlü) yayıncılığa aittir.",
35: "Manuel Castells'in **Ağ Toplumu** kavramı, bilgi çağında iktidar ve servetin hiyerarşik değil ağ yapıları üzerinden aktığını vurgular. İnternetin siyasetten ekonomiye her alanda bu ağ mantığını yerleştirdiğini savunur.",
36: "**Algoritmik görünürlük**, hangi içeriğin kime, ne zaman ve hangi sıklıkla gösterileceğini belirler. Dijital kamusal alanda yeni bir 'kapı tutucu' (gatekeeper) rolü üstlenen algoritmalar, içerik üreticileri için en kritik faktördür.",
37: "**Görünürlük Ekonomisi**, algoritmaların belirlediği kurallara göre içeriklerin ne kadar izleyiciye ulaşabileceğini ifade eder. TikTok'ta keşfet sayfasına çıkmak için yapılan içerik optimizasyonu bu ekonominin en somut örneğidir.",
38: "McLuhan'ın **'Araç Mesajdır'** (medium is the message) formülü, önemli olanın içerik değil aracın kendisi olduğunu savunur. Matbaa, radyo, televizyon ve internet her biri kendi toplumsal dönüşümünü getirmiştir.",
39: "McLuhan'ın **Küresel Köy** (global village) metaforu, elektronik medyanın coğrafi sınırları ortadan kaldırarak insanlığı tek bir anlık iletişim ortamında buluşturduğunu ifade eder. İnternet bu metaforun en somut gerçekleşmesidir.",
40: "Pierre Lévy, siber kültürü çoğulcu, etkileşimli ve kolektif bir alan olarak tanımlar; **tek yönlü iletişim** fikrinden uzaktır. Geleneksel kitle iletişim anlayışı Lévy'nin tam karşısındadır.",
41: "**Dijital Aktivizm**, internet ve sosyal medya üzerinden yürütülen toplumsal eylem biçimlerini kapsar. Hashtag kampanyaları bu aktivizmin en tanınan ve yaygın örneğidir.",
42: "Lévy'nin **Kolektif Zekâ** (collective intelligence) kavramına göre 'kimse her şeyi bilmez ama birlikte herkes her şeyi bilir.' Bilgi, merkezi otoriteden değil dijital ağlardaki bireysel katkıların toplamından doğar.",
43: "Castells'in **Ağ Toplumu** teorisinde yeni medya, bireylerin ve kurumların hiyerarşik değil ağ tabanlı ilişkilerle bilgiye ve etkiye erişmesini sağlar. Bu yapı toplumun örgütlenme biçimini kökten dönüştürmüştür.",
44: "**Algoritmik Görünürlük**, platformun hangi içeriğin kime ve ne sırayla gösterileceğine karar veren otomatik sistemleri ifade eder. Geleneksel editörün yerini algoritmik 'kapı tutucu' almıştır.",
45: "**İkincil Sözlü Kültür**, yazılı teknolojinin altyapısını kullanarak sözlü kültürün anlık ve topluluk odaklı özelliklerini dijitalde yeniden üretir. Sesli mesajlar, canlı yayınlar ve emojiler bu kavramın günümüzdeki karşılıklarıdır.",
46: "Yeni medya iletişimi tek merkezli hale getirmez; aksine **merkezsizleştirir** ve kullanıcı odaklı kılar. 'Tek merkezlilik' geleneksel yayıncılığın özelliğidir, yeni medyanın değil.",
47: "**Dijital Aktivizm**, geleneksel siyasal katılımın yerini almaz; onu çeşitlendirir. Online dilekçeler, hashtag kampanyaları ve anlık örgütlenme biçimleri özellikle gençlerin siyasete katılımında belirleyici rol oynamaktadır.",
48: "İletişim tarihinin kronolojik sırası: **Sözlü Kültür → Yazılı Medya → Elektronik Medya → Yeni Medya**. Bu sıralama hem tarihsel hem teknolojik açıdan tutarlıdır.",
49: "Ong'a göre yazının icadı, bilginin artık ezber yerine **kalıcı metinlere** aktarılabilmesini sağlamıştır. Bu devrim bilgi birikimini ve medeniyet inşasını olanaklı kılmıştır.",
50: "**Elektronik Medya Dönemi**; telegraf, radyo, televizyon ve telefon gibi araçların kitlesel iletişimi mümkün kıldığı, ancak büyük ölçüde tek yönlü yayıncılığın sürdüğü internet öncesi dönemdir.",
51: "Yeni medyanın en belirgin farkı, içerik üretiminin ve dağıtımının artık herkesin yapabileceği bir eylem olmasıdır. **Prosumer** dönüşümü — pasif alıcıdan üretici-tüketiciye geçiş — medya tarihinin en köklü değişimlerinden biridir.",
52: "Yazının ortaya çıkışı, bilginin mekân ve zamana bağlı kalmaksızın **depolanmasına ve kuşaklara aktarılmasına** olanak tanıdı. Bu özellik medya tarihinin en kritik kırılma noktasıdır.",
53: "Sosyal ağların kronolojisi: **SixDegrees (1997) → MySpace (2003) → Facebook (2004) → Twitter (2006)**. SixDegrees, profil ve arkadaş listesi sunan ilk modern sosyal ağ olarak kabul edilir.",
54: "**SixDegrees.com** (1997), profil oluşturma ve arkadaş ekleme gibi temel sosyal ağ işlevlerini sunan ilk platform olarak modern sosyal ağ tarihinin başlangıç noktasıdır.",
55: "Facebook, gerçek isim politikası ve gerçek hayattaki sosyal ağları dijitale taşıma odaklı yapısıyla önceki platformlardan ayrılmıştır. Bu yaklaşım, sosyal medyanın **anonim forumlardan kişisel kimlik platformlarına** dönüşümünde belirleyici olmuştur.",
56: "**FOMO** (Fear of Missing Out / Kaçırma Korkusu), oyuncuları etkinlikleri kaçırma endişesiyle oynamaya iterek oyunu özgür seçimden zorunluluğa dönüştürür. Huizinga'nın 'özgür ve gönüllü' ilkesini doğrudan sorgular.",
57: "**Koltuk Co-op** (aynı odada çok oyunculu oyun), fiziksel mekânda başlayıp biten ve oyun kapandığında sona eren deneyimiyle Magic Circle ilkesine en uygun biçimdir. Gerçek ile oyun arasındaki sınırı bulanıklaştırmaz.",
58: "Matchmaking, drop rate ve dinamik zorluk gibi mekanizmaların **gizli algoritmalarla** belirlenmesi, oyuncunun kurallara tam şeffaf erişimini engeller. 'Kod = Gizli Yasa' olarak ifade edilir.",
59: "**'Oyun = Yaşam Alanı'** paradigması, oyunun kimlik, kariyer, ekonomi ve sosyal alan gibi çok boyutlu roller üstlendiğini savunur. 'Yalnızca bireysel tüketim' tanımı bu paradigmayı reddeden eski anlayışa aittir.",
60: "**Kalıcı Dünyalar** özelliği, oyunun oyuncudan bağımsız var olmaya devam etmesini sağlar. Bu durum oyuncunun oyuna sosyal sorumluluk ve aidiyet hissiyle bağlanmasına, onu 'aktivite' yerine 'sosyal çevre' olarak algılamasına yol açar.",
61: "**Bağlam Çökmesi** (context collapse), sosyal medyada normalde farklı ortamlarda farklı sunulan kimliklerin tek bir karma izleyici kitlesiyle buluşması durumudur. Goffman'ın sahne teorisiyle doğrudan ilişkilidir.",
62: "Goffman'ın **Dramatürjik Yaklaşımı**'nda 'ön sahne' izleyiciler önündeki kontrollü performansı, 'arka sahne' ise hazırlanma sürecini ifade eder. Instagram'daki özenle seçilmiş paylaşımlar ön sahne, bunların hazırlanma süreci arka sahnedir.",
63: "**Slaktivizm**, beğeni ve paylaşım gibi minimum çabayla aktivist kimlik edinildiği ama gerçek değişim için gereken derinliğin oluşmadığı durumu eleştirir. Katılım yanılsaması yaratır; gerçek dönüşüm sağlamaz.",
64: "**Web 2.0**, statik web sayfalarından kullanıcı katılımlı dinamik platformlara geçişi temsil eder. Bu 'read-only'den 'read-write' web anlayışına geçiş, sosyal ağların temelini oluşturur.",
65: "**Hipermetinsellik**, farklı bilgi birimlerinin linklerle birbirine bağlı, doğrusal olmayan bir yapı oluşturmasıdır. Kullanıcının kendi yolunu çizdiği bu yapı, geleneksel baştan sona okuma anlayışının tam karşısındadır.",
66: "**Dijital Okuryazarlık**, dijital araçları kullanmanın ötesinde; bilgiyi bulma, eleştirel değerlendirme, üretme ve etik paylaşma becerilerini kapsar. Yalnızca teknik beceri değil, eleştirel ve yaratıcı boyutları da içerir.",
67: "**Yankı Odası** (echo chamber), algoritmaların ve kullanıcı tercihlerinin bireyi yalnızca kendi görüşleriyle uyumlu içerik ve insanlarla buluşturması sonucu oluşan kapalı bilgi döngüsüdür. Farklı görüşlerle karşılaşma olasılığını sistematik olarak azaltır.",
68: "**Dijital İz** (digital footprint), arama geçmişi, beğeniler, konum verileri ve paylaşımlar gibi internet kullanımı sırasında bırakılan veri izleridir. Bu izler üçüncü taraflarca toplanabilir ve kullanıcıyı profilelemek için kullanılabilir.",
69: "**Ağ Dışsallıkları** (network externalities), platforma katılan her yeni kullanıcının mevcut tüm kullanıcılar için platformu daha değerli kılmasıdır. Bu dinamik, Facebook ve WhatsApp gibi devlerin tekelleşmesini açıklayan temel mekanizmadır.",
70: "**Post-Truth** (hakikat sonrası), nesnel gerçeklerin duygusal çağrılar ve kişisel inançlarla şekillenen iddiaların gerisinde kaldığı medya ortamını tanımlar. Dezenformasyonun ve duygusal manipülasyonun zemin bulduğu dijital çağla doğrudan bağlantılıdır.",
71: "Yeni medyada **Geçit Bekçiliği** (gatekeeping) rolü, geleneksel editörlerden platform algoritmalarına ve içerik moderasyon sistemlerine kaymıştır. Ancak bu değişim geçit bekçiliğinin ortadan kalktığı anlamına gelmez.",
72: "**Siber Zorbalık**'ın geleneksel zorbalıktan temel farkı, mağdurun ev veya okul gibi 'güvenli alanlarda' bile rahat olamamasıdır. 7/24 süren, anonim yapılabilen ve kitlesel yayılabilen içerikler bu farkı keskinleştirir.",
73: "**Online Grooming**, kötü niyetli kişilerin çevrimiçi ortamda güven ilişkisi kurarak çocuk veya gençleri istismar amacıyla manipüle ettiği süreçtir. Dijital platformlardaki en ciddi güvenlik risklerinden biridir.",
74: "Çevrimiçi radikalleşmede **algoritmaların öneri kanalı** belirleyici rol oynar: merak veya marjinal içerik tüketimi başlangıç noktasından giderek daha aşırı içeriklere yönlendirme yapılır. Platformların etkileşim maksimizasyonu bu süreci hızlandırır.",
75: "**Phishing** (oltalama), gerçek gibi görünen sahte e-posta, site veya mesajlar aracılığıyla kullanıcının parola, kredi kartı veya kişisel verilerini ele geçirmeyi hedefler. Sosyal mühendislik tabanlı en yaygın siber saldırı türüdür.",
76: "**Veri Minimizasyonu** (data minimization), GDPR kapsamında kurumların yalnızca belirli amaçlar için gerekli olan asgari miktarda veri toplamasını ve gerekenden uzun süre saklamamasını öngören bir ilkedir.",
77: "**Siber Nefret Söylemi**, kişiyi bireysel özellikleri nedeniyle değil, ait olduğu gruptan (ırk, din, cinsiyet vb.) dolayı hedef alır. Grupsal hedefleme, onu sıradan hakaretten kavramsal olarak ayıran temel unsurdur.",
78: "**EU Kids Online** çerçevesi gençlerin çevrimiçi risklerini dört boyutta inceler: **İçerik** (content), **Temas** (contact), **Davranış** (conduct) ve **Sözleşme/Mahremiyet** (contract). Bu model araştırmanın temel kavramsal çerçevesini oluşturur.",
79: "**Değişken Oranlı Pekiştirme**, ödülün tahmin edilemez aralıklarla gelmesiyle oluşur — tıpkı kumar makinelerinde olduğu gibi. Sosyal medyada bildirim gelip gelmeyeceğinin belirsizliği bu mekanizmanın dijital karşılığıdır ve bağımlılığı en güçlü tetikleyen ödül şemasıdır.",
80: "**Parasosyal İlişki**, izleyicinin bir medya figürüyle (YouTuber, influencer) gerçek etkileşim olmaksızın sanki gerçek bir arkadaşmış gibi hissettiği tek yönlü yakınlıktır. Medya figürü izleyiciyi tanımaz; ilişki yalnızca izleyicide vardır.",
81: "**Doomscrolling**, özellikle kriz dönemlerinde kullanıcıların olumsuz haberler karşısında kendini durduramayarak kaydırmayı sürdürmesidir. 'Kaçınmayı sürdürme paradoksu' olarak tanımlanan bu davranış anksiyete ve bilişsel yük ile güçlü ilişki taşır.",
82: "Yapay zekanın gazetecilik alanında kullanımındaki en temel etik kaygı, **önyargılı eğitim verisi** nedeniyle belirli grupların sistematik olarak eksik veya yanlış temsil edilmesidir. Bu, YZ tabanlı haber üretiminde ayrımcılığa zemin hazırlayabilir.",
83: "**YZ Halüsinasyonu**, büyük dil modellerinin var olmayan alıntılar, uydurma istatistikler veya yanlış olgular gibi son derece güvenilir görünen ama gerçek olmayan içerikler üretmesidir. Bu nedenle YZ araçlarının eleştirel kullanımı zorunludur.",
84: "**Platform Kapitalizmi**, Amazon, Google, Meta ve Apple gibi dijital platformların altyapıyı kontrol ederek veri ve ağ etkilerinden yararlandığı ve egemen ekonomik güç haline geldiği kapitalizm biçimini ifade eder. ⚠️ PDF'te D yazsa da doğru cevap **C** şıkkıdır.",
85: "**Dijital Detoks**, bireyin ekran ve dijital araçlardan bilinçli olarak uzaklaştığı süreçtir. Aşırı medya kullanımının neden olduğu bilişsel yük, uyku bozukluğu ve anksiyeteyi gidermeye yardımcı olduğu düşünülmektedir.",
86: "**Influencer Pazarlaması**, geleneksel reklam mantığından farklı olarak izleyicinin influencer ile kurduğu parasosyal ilişkiye ve ona atfettiği özgünlük algısına dayanır. Tanıtım içerikleri 'samimi öneri' gibi algılanınca ikna kapasitesi artar.",
87: "**Dijital Vatandaşlık**, bireylerin çevrimiçi ortamda haklarını ve sorumluluklarını bilerek, etik ve güvenli biçimde davranmasını ifade eder. Dijital okuryazarlık, mahremiyet, siber etik ve eleştirel düşünce gibi birden fazla yetkinliği kapsar.",
88: "Kaynak doğrulamadan yapılan paylaşımlar kasıtsız da olsa yanlış bilgi yaymaya yol açabilir. Bu durum, kötü niyet olmadan gerçekleşen yanlış bilgi yayılımı olan **Mizenformasyon** kategorisine girer.",
89: "**İçerik Moderasyonu**, nefret söylemi ve şiddet gibi zararlı içerikleri tespit edip kaldıran veya kısıtlayan süreçtir. İfade özgürlüğü ile güvenli platform dengesi arasındaki gerilim bu sürecin tartışmalı boyutunu oluşturur.",
90: "**Deepfake ve Ses Klonlama**, gerçek kişilerin söylemediği konuşmaların üretilmesine olanak tanır. Bireysel itibar zedeleme, siyasi manipülasyon ve kurumsal güven erozyonu bu teknolojilerin en ciddi toplumsal riskleridir.",
91: "**Dijital Kimlik**, bireyin çevrimiçi platformlarda nasıl kurgulandığını ve sunulduğunu ifade eder. Goffman'ın dramatürjik teorisiyle bağlantılı bu kavram; profil fotoğrafı, paylaşım içerikleri ve dil tercihleri gibi unsurlarla şekillenir.",
92: "**Uzun Kuyruk Ekonomisi** (long tail), dijital dağıtımın coğrafi ve raf alanı kısıtlamalarını ortadan kaldırarak niş ürün ve içeriklerin geniş izleyiciye ulaşmasını mümkün kıldığını savunur. Chris Anderson'ın geliştirdiği bu teori dijital pazar yapısını kökten değiştirmiştir.",
93: "**Deepfake** teknolojisi, GAN mimarisinde Üretici ağ ile Ayırt Edici ağın çekişmeli öğrenmesi yoluyla gerçek görüntü ve ses verilerinden sentetik içerik üretir. Bu süreç giderek daha ikna edici ve tespit edilmesi güç içerikler oluşturur.",
94: "**Eleştirel Tüketim** (critical consumption), medya içeriklerini 'kim ürettı, neden ürettı, hangi mesajı taşıyor, hangi perspektifi dışlıyor?' sorularıyla analiz etme becerisidir. Dezenformasyona ve manipülasyona karşı temel koruma mekanizmasıdır.",
95: "**Viral Kültür**, platform algoritmalarının etkileşim bazlı yükseltme mekanizmaları sayesinde içeriklerin kısa sürede milyonlara ulaşabilmesidir. Taklit, remix ve challenge zincirleri bu yayılımın temel dinamiklerini oluşturur.",
96: "**Nötr Platform** içerikten yasal sorumluluk taşımazken **Yayıncı** yayımladığından sorumludur. Büyük platformların aktif içerik moderasyonu yapması onları giderek editöryal karar alan yayıncılara yaklaştırmakta ve bu muafiyeti tartışmalı kılmaktadır.",
97: "**YZ Okuryazarlığı**, yapay zekanın nasıl çalıştığını, sınırlılıklarını ve önyargılarını anlayarak araçları eleştirel ve etik biçimde kullanabilme becerisidir. Dijital okuryazarlığın 21. yüzyıl uzantısı olarak değerlendirilir.",
98: "**Kutuplaşma**, filtre balonları ve yankı odaları aracılığıyla algoritmaların bireyleri yalnızca kendi görüşleriyle uyumlu içeriklere maruz bırakmasından kaynaklanır. Onaylama önyargısını besleyen bu dinamik toplumsal ayrışmayı derinleştirir.",
99: "**Asimetrik Bilgi** sorunu, içerik üretiminin demokratikleşmesiyle birlikte kalite değerlendirmesinin güçleşmesi ve algoritmaların güvenilirliği değil etkileşimi ön plana çıkarmasıyla büyür. Nitelikli ve niteliksiz içerikler aynı görünürlük alanında rekabet eder.",
100: "Henry Jenkins'in **Yakınsama Kültürü** (convergence culture), medya içeriklerinin birden fazla platformda dolaştığı, kullanıcıların pasif tüketiciden aktif katılımcıya dönüştüğü ve kolektif zekanın bilgi üretimine katkıda bulunduğu kültürel ortamı ifade eder.",
}

# Topic mapping based on question content
TOPIC_MAP = {
    1: "Dijital Riskler", 2: "Gözetim Kapitalizmi", 3: "Algoritmalar", 4: "Medya Teorileri",
    5: "Yapay Zeka", 6: "Bilgi Kirliliği", 7: "Gözetim Kapitalizmi", 8: "Medya Psikolojisi",
    9: "Bilgi Kirliliği", 10: "Siber Kültür", 11: "Medya Teorileri", 12: "Medya Psikolojisi",
    13: "Yapay Zeka", 14: "Medya Teorileri", 15: "Yeni Medya", 16: "Dijital Eşitsizlik",
    17: "Algoritmalar", 18: "Platform Ekonomisi", 19: "Bilgi Kirliliği", 20: "Platform Ekonomisi",
    21: "Yapay Zeka", 22: "Yapay Zeka", 23: "Medya Teorileri", 24: "Medya Teorileri",
    25: "Dijital Kimlik", 26: "Medya Teorileri", 27: "Katılımcı Kültür", 28: "Yapay Zeka",
    29: "Dijital Eşitsizlik", 30: "Dijital İletişim", 31: "Platform Ekonomisi", 32: "Bilgi Kirliliği",
    33: "Katılımcı Kültür", 34: "Yeni Medya", 35: "Medya Teorileri", 36: "Algoritmalar",
    37: "Algoritmalar", 38: "Medya Teorileri", 39: "Medya Teorileri", 40: "Siber Kültür",
    41: "Dijital Aktivizm", 42: "Siber Kültür", 43: "Medya Teorileri", 44: "Algoritmalar",
    45: "Medya Teorileri", 46: "Yeni Medya", 47: "Dijital Aktivizm", 48: "Medya Tarihi",
    49: "Medya Tarihi", 50: "Medya Tarihi", 51: "Yeni Medya", 52: "Medya Tarihi",
    53: "Sosyal Medya", 54: "Sosyal Medya", 55: "Sosyal Medya", 56: "Dijital Oyunlar",
    57: "Dijital Oyunlar", 58: "Dijital Oyunlar", 59: "Dijital Oyunlar", 60: "Dijital Oyunlar",
    61: "Dijital Kimlik", 62: "Dijital Kimlik", 63: "Dijital Aktivizm", 64: "Sosyal Medya",
    65: "Yeni Medya", 66: "Dijital Okuryazarlık", 67: "Algoritmalar", 68: "Mahremiyet",
    69: "Platform Ekonomisi", 70: "Bilgi Kirliliği", 71: "Medya Teorileri", 72: "Siber Güvenlik",
    73: "Siber Güvenlik", 74: "Siber Güvenlik", 75: "Siber Güvenlik", 76: "Mahremiyet",
    77: "Siber Güvenlik", 78: "Dijital Riskler", 79: "Medya Psikolojisi", 80: "Medya Psikolojisi",
    81: "Medya Psikolojisi", 82: "Yapay Zeka", 83: "Yapay Zeka", 84: "Platform Ekonomisi",
    85: "Medya Psikolojisi", 86: "Sosyal Medya", 87: "Dijital Okuryazarlık", 88: "Bilgi Kirliliği",
    89: "Platform Yönetimi", 90: "Yapay Zeka", 91: "Dijital Kimlik", 92: "Platform Ekonomisi",
    93: "Yapay Zeka", 94: "Dijital Okuryazarlık", 95: "Sosyal Medya", 96: "Platform Yönetimi",
    97: "Dijital Okuryazarlık", 98: "Algoritmalar", 99: "Bilgi Kirliliği", 100: "Katılımcı Kültür",
}

with open('C:/Users/baris/Desktop/DynamicWeb/pdf_extracted.txt', 'r', encoding='utf-8') as f:
    text = f.read()

parts = re.split(r'\n(?=\d+\. )', text)
questions_raw = []
for part in parts:
    m = re.match(r'^(\d+)\. (.+)', part, re.DOTALL)
    if m:
        questions_raw.append((int(m.group(1)), m.group(2).strip()))

def parse_question(num, body):
    lines = body.split('\n')
    opt_pattern = re.compile(r'^([A-E])\)\s*(.+)')
    question_lines = []
    options = {}
    option_order = []
    current_opt = None
    answer_section = []
    in_answer = False

    for line in lines:
        stripped = line.strip()
        if in_answer:
            answer_section.append(stripped)
            continue
        if re.match(r'^Do[ğg]ru', stripped, re.IGNORECASE):
            in_answer = True
            answer_section.append(stripped)
            current_opt = None
            continue
        opt_m = opt_pattern.match(stripped)
        if opt_m:
            current_opt = opt_m.group(1).upper()
            options[current_opt] = opt_m.group(2).strip()
            option_order.append(current_opt)
            continue
        if current_opt and stripped:
            options[current_opt] = options[current_opt] + ' ' + stripped
            continue
        if not current_opt and stripped:
            question_lines.append(stripped)

    question_text = ' '.join(question_lines).strip()
    answer_text = ' '.join(answer_section)

    correct_letter = None
    am = re.search(r'Do[ğg]ru Cevap\s*:\s*([A-Ea-e])', answer_text, re.IGNORECASE)
    if am:
        correct_letter = am.group(1).lower()

    explanation = ''
    exp_idx = answer_text.find('Açıklama:')
    if exp_idx == -1:
        exp_idx = answer_text.find('açıklama:')
    if exp_idx >= 0:
        explanation = answer_text[exp_idx + len('Açıklama:'):].strip().strip('|').strip()

    return {
        'question': question_text,
        'options': options,
        'option_order': option_order,
        'correct': correct_letter,
        'explanation': explanation
    }

# Fix for Q50 — B option was missing
Q50_FIX = {
    'A': 'Bilginin yalnızca sözlü aktarımı',
    'B': 'Matbaa öncesi sözlü hikâye anlatımı',
    'C': 'İnternet ağları üzerinden karşılıklı etkileşimli iletişim',
    'D': 'Telegraf, radyo ve televizyon gibi araçlarla kitlesel iletişim',
    'E': 'Akıllı cihazlar aracılığıyla kişiselleştirilmiş içerik tüketimi',
}

# Build questions array
questions_json = []
for num, body in questions_raw:
    p = parse_question(num, body)

    # Override Q50 options
    if num == 50:
        p['options'] = Q50_FIX
        p['option_order'] = ['A', 'B', 'C', 'D', 'E']
        p['correct'] = 'd'

    # Override Q84 correct answer
    if num == 84:
        p['correct'] = 'c'

    # Build options list in order
    opts_list = []
    for letter in p['option_order']:
        if letter in p['options']:
            opts_list.append({
                'id': letter.lower(),
                'label': letter,
                'text': p['options'][letter]
            })
    # Ensure we have all 5 options
    all_letters = ['A', 'B', 'C', 'D', 'E']
    present = {o['label'] for o in opts_list}
    for letter in all_letters:
        if letter not in present:
            opts_list.append({'id': letter.lower(), 'label': letter, 'text': '(seçenek mevcut değil)'})
    opts_list.sort(key=lambda x: x['label'])

    # Build explanation
    pdf_exp = p['explanation'].strip()
    ai_summary = AI_SUMMARIES.get(num, '')
    if pdf_exp and ai_summary:
        full_explanation = f"{pdf_exp}\n\n---\n\n{ai_summary}"
    elif pdf_exp:
        full_explanation = pdf_exp
    else:
        full_explanation = ai_summary

    q_id = f"ym-{num:03d}"
    q = {
        'id': q_id,
        'type': 'single_choice',
        'topic': TOPIC_MAP.get(num, 'Dijital Medya'),
        'difficulty': 'medium',
        'questionMd': p['question'],
        'options': opts_list,
        'correctAnswer': [p['correct']] if p['correct'] else ['a'],
        'explanationMd': full_explanation,
        'tags': [TOPIC_MAP.get(num, 'dijital-medya').lower().replace(' ', '-')],
        'sourceRefs': ['final_hazirlik_sorulari_100.pdf'],
    }
    questions_json.append(q)

# Build full quiz JSON
quiz_json = {
    'meta': {
        'id': 'yeni-medya-final',
        'title': 'Yeni Medya — Final Hazırlık (100 Soru)',
        'description': 'Dijital medya, algoritmalar, sosyal medya psikolojisi, yapay zeka ve internet kültürü üzerine 100 soru.',
        'source': 'Yeni Medya Final Hazırlık',
        'course': 'Yeni Medya',
        'topic': 'Dijital Medya',
        'topics': [
            'Algoritmalar', 'Bilgi Kirliliği', 'Dijital Aktivizm', 'Dijital Eşitsizlik',
            'Dijital İletişim', 'Dijital Kimlik', 'Dijital Okuyazarlık', 'Dijital Oyunlar',
            'Dijital Riskler', 'Gözetim Kapitalizmi', 'Katılımcı Kültür', 'Mahremiyet',
            'Medya Psikolojisi', 'Medya Tarihi', 'Medya Teorileri', 'Platform Ekonomisi',
            'Platform Yönetimi', 'Siber Güvenlik', 'Siber Kültür', 'Sosyal Medya',
            'Yapay Zeka', 'Yeni Medya'
        ],
        'questionCount': 100,
        'difficulty': 'medium',
        'estimatedMinutes': 150,
        'tags': ['yeni-medya', 'final', 'dijital'],
        'fileName': 'yeni-medya/yeni-medya-final.json',
        'autoExplanationPopup': True,
    },
    'questions': questions_json
}

# Write output
out_dir = 'C:/Users/baris/Desktop/DynamicWeb/public/data/quizzes/yeni-medya'
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, 'yeni-medya-final.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(quiz_json, f, ensure_ascii=False, indent=2)

print(f"Written {len(questions_json)} questions to {out_path}")
print(f"File size: {os.path.getsize(out_path):,} bytes")

# Verify Q84
q84 = next(q for q in questions_json if q['id'] == 'ym-084')
print(f"\nQ84 check: correctAnswer={q84['correctAnswer']}")
print(f"Q84 C option: {next(o['text'][:60] for o in q84['options'] if o['id']=='c')}")

# Verify Q50
q50 = next(q for q in questions_json if q['id'] == 'ym-050')
print(f"\nQ50 options: {[o['label'] for o in q50['options']]}")
print(f"Q50 B: {q50['options'][1]['text']}")
print(f"Q50 D: {q50['options'][3]['text']}")
print(f"Q50 correct: {q50['correctAnswer']}")
