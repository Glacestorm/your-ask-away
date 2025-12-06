// Mapa de descripciones de códigos CNAE comunes en Andorra (ampliado)
export const cnaeDescriptions: Record<string, string> = {
  // Agricultura, ganadería, silvicultura y pesca (01-03)
  '0111': 'Conreu de cereals, lleguminoses i llavors oleaginoses',
  '0113': 'Conreu d\'hortalisses, arrels i tubercles',
  '0121': 'Conreu de la vinya',
  '0141': 'Explotació de bestiar boví per a la producció de llet',
  '0147': 'Avicultura',
  '0210': 'Silvicultura i altres activitats forestals',
  '0311': 'Pesca marina',
  
  // Industrias extractivas (05-09)
  '0510': 'Extracció d\'antracita i hulla',
  '0710': 'Extracció de minerals de ferro',
  '0812': 'Extracció de graves i sorres',
  '0899': 'Altres indústries extractives',
  
  // Industria manufacturera (10-33)
  '1011': 'Processat i conservació de carn',
  '1020': 'Processat i conservació de peixos',
  '1039': 'Altre processament de fruites i hortalisses',
  '1051': 'Preparació de llet i fabricació de productes lactis',
  '1071': 'Fabricació de pa i productes frescos de fleca',
  '1082': 'Fabricació de cacau, xocolata i confiteria',
  '1101': 'Destil·lació i elaboració de begudes alcohòliques',
  '1102': 'Elaboració de vins',
  '1105': 'Fabricació de cervesa',
  '1107': 'Fabricació de begudes no alcohòliques',
  '1200': 'Elaboració de productes del tabac',
  '1320': 'Fabricació de teixits tèxtils',
  '1413': 'Confecció de roba exterior',
  '1419': 'Confecció d\'altres peces de vestir',
  '1520': 'Fabricació de calçat',
  '1629': 'Fabricació d\'altres productes de fusta',
  '1712': 'Fabricació de paper i cartó',
  '1812': 'Altres activitats d\'impressió',
  '2011': 'Fabricació de gasos industrials',
  '2041': 'Fabricació de sabons i detergents',
  '2042': 'Fabricació de perfums i productes de cosmètica',
  '2120': 'Fabricació de productes farmacèutics',
  '2211': 'Fabricació de pneumàtics',
  '2222': 'Fabricació d\'envasos de plàstic',
  '2311': 'Fabricació de vidre pla',
  '2320': 'Fabricació de productes ceràmics refractaris',
  '2410': 'Fabricació de productes bàsics de ferro i acer',
  '2511': 'Fabricació d\'estructures metàl·liques',
  '2562': 'Enginyeria mecànica general per compte d\'altri',
  '2611': 'Fabricació de components electrònics',
  '2620': 'Fabricació d\'ordinadors i equips perifèrics',
  '2630': 'Fabricació d\'equips de telecomunicacions',
  '2640': 'Fabricació de productes electrònics de consum',
  '2651': 'Fabricació d\'instruments de mesura i control',
  '2660': 'Fabricació d\'equips de radiació i electroteràpia',
  '2670': 'Fabricació d\'instruments òptics i equips fotogràfics',
  '2711': 'Fabricació de motors i generadors elèctrics',
  '2812': 'Fabricació d\'equips hidràulics i pneumàtics',
  '2892': 'Fabricació de maquinària per a indústries extractives',
  '2910': 'Fabricació de vehicles de motor',
  '2932': 'Fabricació d\'altres components per a vehicles',
  '3011': 'Construcció de vaixells i estructures flotants',
  '3030': 'Construcció aeronàutica i espacial',
  '3092': 'Fabricació de bicicletes',
  '3101': 'Fabricació de mobles d\'oficina',
  '3102': 'Fabricació de mobles de cuina',
  '3109': 'Fabricació d\'altres mobles',
  '3212': 'Fabricació de joieria',
  '3230': 'Fabricació d\'articles esportius',
  '3240': 'Fabricació de jocs i joguines',
  '3250': 'Fabricació d\'instruments mèdics i odontològics',
  '3311': 'Reparació de productes metàl·lics',
  '3312': 'Reparació de maquinària',
  '3313': 'Reparació d\'equips electrònics i òptics',
  '3314': 'Reparació d\'equips elèctrics',
  '3315': 'Reparació i manteniment naval',
  '3316': 'Reparació i manteniment aeronàutic',
  '3317': 'Reparació i manteniment d\'altre material de transport',
  '3319': 'Reparació d\'altres equips',
  '3320': 'Instal·lació de maquinària i equips industrials',
  
  // Suministro de energía y agua (35-39)
  '3511': 'Producció d\'energia elèctrica',
  '3512': 'Transport d\'energia elèctrica',
  '3513': 'Distribució d\'energia elèctrica',
  '3514': 'Comerç d\'energia elèctrica',
  '3521': 'Producció de gas',
  '3522': 'Distribució de combustibles gasosos',
  '3530': 'Subministrament de vapor i aire condicionat',
  '3600': 'Captació, depuració i distribució d\'aigua',
  '3700': 'Recollida i tractament d\'aigües residuals',
  '3811': 'Recollida de residus no perillosos',
  '3812': 'Recollida de residus perillosos',
  '3821': 'Tractament de residus no perillosos',
  '3822': 'Tractament de residus perillosos',
  '3831': 'Separació i classificació de materials',
  '3832': 'Valorització de materials ja classificats',
  '3900': 'Activitats de descontaminació i altres serveis de gestió de residus',
  
  // Construcción (41-43)
  '4110': 'Promoció immobiliària',
  '4121': 'Construcció d\'edificis residencials',
  '4122': 'Construcció d\'edificis no residencials',
  '4211': 'Construcció de carreteres i autopistes',
  '4212': 'Construcció de vies fèrries',
  '4213': 'Construcció de ponts i túnels',
  '4221': 'Construcció de xarxes per a fluids',
  '4222': 'Construcció de xarxes elèctriques i de telecomunicacions',
  '4291': 'Obres hidràuliques',
  '4299': 'Construcció d\'altres projectes d\'enginyeria civil',
  '4311': 'Demolició',
  '4312': 'Preparació de terrenys',
  '4313': 'Perforacions i sondejos',
  '4321': 'Instal·lacions elèctriques',
  '4322': 'Fontaneria, instal·lacions de sistemes de calefacció i aire condicionat',
  '4329': 'Altres instal·lacions en obres de construcció',
  '4331': 'Arrebossat',
  '4332': 'Instal·lació de fusteria',
  '4333': 'Revestiment de terres i parets',
  '4334': 'Pintura i envidriament',
  '4339': 'Altres acabats d\'edificis',
  '4391': 'Construcció de cobertes',
  '4399': 'Altres activitats de construcció especialitzada',
  
  // Comercio (45-47)
  '4511': 'Venda de vehicles de motor',
  '4519': 'Venda d\'altres vehicles de motor',
  '4520': 'Manteniment i reparació de vehicles de motor',
  '4531': 'Comerç a l\'engròs de recanvis de vehicles',
  '4532': 'Comerç al detall de recanvis de vehicles',
  '4540': 'Venda i reparació de motocicletes',
  '4611': 'Intermediaris del comerç de matèries primeres agràries',
  '4612': 'Intermediaris del comerç de combustibles i minerals',
  '4613': 'Intermediaris del comerç de fusta i materials de construcció',
  '4614': 'Intermediaris del comerç de maquinària',
  '4615': 'Intermediaris del comerç de mobles i articles de la llar',
  '4616': 'Intermediaris del comerç de tèxtils i calçat',
  '4617': 'Intermediaris del comerç de productes alimentaris',
  '4618': 'Intermediaris del comerç especialitzats en altres productes',
  '4619': 'Intermediaris del comerç de productes diversos',
  '4621': 'Comerç a l\'engròs de cereals i llavors',
  '4622': 'Comerç a l\'engròs de flors i plantes',
  '4623': 'Comerç a l\'engròs d\'animals vius',
  '4624': 'Comerç a l\'engròs de cuirs i pells',
  '4631': 'Comerç a l\'engròs de fruites i hortalisses',
  '4632': 'Comerç a l\'engròs de carn i productes carnis',
  '4633': 'Comerç a l\'engròs de productes lactis, ous i olis',
  '4634': 'Comerç a l\'engròs de begudes',
  '4635': 'Comerç a l\'engròs de productes del tabac',
  '4636': 'Comerç a l\'engròs de sucre, xocolata i confiteria',
  '4637': 'Comerç a l\'engròs de cafè, te, cacau i espècies',
  '4638': 'Comerç a l\'engròs d\'altres aliments',
  '4639': 'Comerç a l\'engròs no especialitzat d\'aliments i begudes',
  '4641': 'Comerç a l\'engròs de tèxtils',
  '4642': 'Comerç a l\'engròs de peces de vestir i calçat',
  '4643': 'Comerç a l\'engròs d\'aparells electrodomèstics',
  '4644': 'Comerç a l\'engròs de porcellana i cristalleria',
  '4645': 'Comerç a l\'engròs de perfumeria i cosmètica',
  '4646': 'Comerç a l\'engròs de productes farmacèutics',
  '4647': 'Comerç a l\'engròs de mobles i catifes',
  '4648': 'Comerç a l\'engròs de rellotgeria i joieria',
  '4649': 'Comerç a l\'engròs d\'altres articles d\'ús domèstic',
  '4651': 'Comerç a l\'engròs d\'ordinadors i programes informàtics',
  '4652': 'Comerç a l\'engròs d\'equips electrònics i de telecomunicacions',
  '4661': 'Comerç a l\'engròs de maquinària agrícola',
  '4662': 'Comerç a l\'engròs de màquines eina',
  '4663': 'Comerç a l\'engròs de maquinària per a la mineria',
  '4664': 'Comerç a l\'engròs de maquinària tèxtil',
  '4665': 'Comerç a l\'engròs de mobles d\'oficina',
  '4666': 'Comerç a l\'engròs d\'altra maquinària d\'oficina',
  '4669': 'Comerç a l\'engròs d\'altra maquinària i equips',
  '4671': 'Comerç a l\'engròs de combustibles sòlids, líquids i gasosos',
  '4672': 'Comerç a l\'engròs de metalls i minerals metàl·lics',
  '4673': 'Comerç a l\'engròs de fusta i materials de construcció',
  '4674': 'Comerç a l\'engròs de ferreteria',
  '4675': 'Comerç a l\'engròs de productes químics',
  '4676': 'Comerç a l\'engròs d\'altres productes semielaborats',
  '4677': 'Comerç a l\'engròs de ferralla i productes de rebuig',
  '4690': 'Comerç a l\'engròs no especialitzat',
  '4711': 'Comerç al detall en establiments no especialitzats',
  '4719': 'Altre comerç al detall no especialitzat',
  '4721': 'Comerç al detall de fruites i hortalisses',
  '4722': 'Comerç al detall de carn i productes carnis',
  '4723': 'Comerç al detall de peix i marisc',
  '4724': 'Comerç al detall de pa i productes de fleca',
  '4725': 'Comerç al detall de begudes',
  '4726': 'Comerç al detall de productes del tabac',
  '4729': 'Altre comerç al detall d\'aliments',
  '4730': 'Comerç al detall de combustible per a l\'automoció',
  '4741': 'Comerç al detall d\'ordinadors i programes',
  '4742': 'Comerç al detall d\'equips de telecomunicacions',
  '4743': 'Comerç al detall d\'equips d\'àudio i vídeo',
  '4751': 'Comerç al detall de teixits',
  '4752': 'Comerç al detall de ferreteria, pintures i vidre',
  '4753': 'Comerç al detall de catifes i revestiments',
  '4754': 'Comerç al detall d\'electrodomèstics',
  '4759': 'Comerç al detall de mobles i articles per a la llar',
  '4761': 'Comerç al detall de llibres',
  '4762': 'Comerç al detall de diaris i articles de papereria',
  '4763': 'Comerç al detall de gravacions de música i vídeo',
  '4764': 'Comerç al detall d\'articles esportius',
  '4765': 'Comerç al detall de jocs i joguines',
  '4771': 'Comerç al detall de peces de vestir',
  '4772': 'Comerç al detall de calçat i articles de cuir',
  '4773': 'Comerç al detall de productes farmacèutics',
  '4774': 'Comerç al detall d\'articles mèdics i ortopèdics',
  '4775': 'Comerç al detall de productes cosmètics i d\'higiene',
  '4776': 'Comerç al detall de flors, plantes i animals',
  '4777': 'Comerç al detall de rellotgeria i joieria',
  '4778': 'Altre comerç al detall d\'articles nous',
  '4779': 'Comerç al detall d\'articles de segona mà',
  '4781': 'Comerç al detall de productes alimentaris en parades',
  '4782': 'Comerç al detall de tèxtils i calçat en parades',
  '4789': 'Comerç al detall d\'altres productes en parades',
  '4791': 'Comerç al detall per correspondència i per Internet',
  '4799': 'Altre comerç al detall fora d\'establiments',
  
  // Transporte y almacenamiento (49-53)
  '4910': 'Transport interurbà de passatgers per ferrocarril',
  '4920': 'Transport de mercaderies per ferrocarril',
  '4931': 'Transport terrestre urbà de passatgers',
  '4932': 'Transport per taxi',
  '4939': 'Altres tipus de transport terrestre de passatgers',
  '4941': 'Transport de mercaderies per carretera',
  '4942': 'Serveis de mudança',
  '4950': 'Transport per canonada',
  '5010': 'Transport marítim de passatgers',
  '5020': 'Transport marítim de mercaderies',
  '5030': 'Transport de passatgers per vies navegables interiors',
  '5040': 'Transport de mercaderies per vies navegables interiors',
  '5110': 'Transport aeri de passatgers',
  '5121': 'Transport aeri de mercaderies',
  '5210': 'Dipòsit i emmagatzematge',
  '5221': 'Activitats annexes al transport terrestre',
  '5222': 'Activitats annexes al transport marítim',
  '5223': 'Activitats annexes al transport aeri',
  '5224': 'Manipulació de mercaderies',
  '5229': 'Altres activitats annexes al transport',
  '5310': 'Activitats postals subjectes a obligació de servei universal',
  '5320': 'Altres activitats postals i de correus',
  
  // Hostelería (55-56)
  '5510': 'Hotels i allotjaments similars',
  '5520': 'Allotjaments turístics i altres allotjaments de curta estada',
  '5530': 'Càmpings i aparcaments per a caravanes',
  '5590': 'Altres allotjaments',
  '5610': 'Restaurants i establiments de menjar',
  '5621': 'Provisió de menjars preparats per a esdeveniments',
  '5629': 'Altres serveis de menjars',
  '5630': 'Establiments de begudes',
  
  // Información y comunicaciones (58-63)
  '5811': 'Edició de llibres',
  '5812': 'Edició de directoris i guies d\'adreces postals',
  '5813': 'Edició de periòdics',
  '5814': 'Edició de revistes',
  '5819': 'Altres activitats d\'edició',
  '5821': 'Edició de videojocs',
  '5829': 'Edició d\'altres programes informàtics',
  '5911': 'Activitats de producció cinematogràfica i de vídeo',
  '5912': 'Activitats de postproducció cinematogràfica',
  '5913': 'Activitats de distribució cinematogràfica',
  '5914': 'Activitats d\'exhibició cinematogràfica',
  '5920': 'Activitats d\'enregistrament de so i edició musical',
  '6010': 'Activitats de radiodifusió',
  '6020': 'Activitats de programació i emissió de televisió',
  '6110': 'Telecomunicacions per cable',
  '6120': 'Telecomunicacions sense fils',
  '6130': 'Telecomunicacions per satèl·lit',
  '6190': 'Altres activitats de telecomunicacions',
  '6201': 'Activitats de programació informàtica',
  '6202': 'Activitats de consultoria informàtica',
  '6203': 'Gestió de recursos informàtics',
  '6209': 'Altres serveis relacionats amb les tecnologies de la informació',
  '6311': 'Processament de dades, hosting i activitats relacionades',
  '6312': 'Portals web',
  '6391': 'Activitats d\'agències de notícies',
  '6399': 'Altres serveis d\'informació',
  
  // Actividades financieras y de seguros (64-66)
  '6411': 'Banca central',
  '6419': 'Altra intermediació monetària',
  '6420': 'Activitats de les societats holding',
  '6430': 'Inversió col·lectiva, fons i entitats financeres similars',
  '6491': 'Arrendament financer',
  '6492': 'Altres activitats creditícies',
  '6499': 'Altres serveis financers, excepte assegurances i fons de pensions',
  '6511': 'Assegurances de vida',
  '6512': 'Assegurances diferents de les de vida',
  '6520': 'Reassegurances',
  '6530': 'Fons de pensions',
  '6611': 'Administració de mercats financers',
  '6612': 'Activitats d\'intermediació en operacions amb valors',
  '6619': 'Altres activitats auxiliars als serveis financers',
  '6621': 'Avaluació de riscos i danys',
  '6622': 'Activitats d\'agents i corredors d\'assegurances',
  '6629': 'Altres activitats auxiliars a assegurances i fons de pensions',
  '6630': 'Activitats de gestió de fons',
  
  // Actividades inmobiliarias (68)
  '6810': 'Compravenda de béns immobiliaris per compte propi',
  '6820': 'Lloguer de béns immobiliaris per compte propi',
  '6831': 'Agents de la propietat immobiliària',
  '6832': 'Gestió i administració de la propietat immobiliària',
  
  // Actividades profesionales, científicas y técnicas (69-75)
  '6910': 'Activitats jurídiques',
  '6920': 'Activitats de comptabilitat, tenidoria de llibres, auditoria i assessoria fiscal',
  '7010': 'Activitats de les seus centrals',
  '7021': 'Relacions públiques i comunicació',
  '7022': 'Altres activitats de consultoria de gestió empresarial',
  '7111': 'Serveis tècnics d\'arquitectura',
  '7112': 'Serveis tècnics d\'enginyeria i altres activitats relacionades',
  '7120': 'Assajos i anàlisis tècnics',
  '7211': 'Recerca i desenvolupament experimental en biotecnologia',
  '7219': 'Altra recerca i desenvolupament en ciències naturals i tècniques',
  '7220': 'Recerca i desenvolupament en ciències socials i humanitats',
  '7311': 'Agències de publicitat',
  '7312': 'Serveis de representació de mitjans de comunicació',
  '7320': 'Estudis de mercat i enquestes d\'opinió pública',
  '7410': 'Activitats de disseny especialitzat',
  '7420': 'Activitats de fotografia',
  '7430': 'Activitats de traducció i interpretació',
  '7490': 'Altres activitats professionals, científiques i tècniques',
  '7500': 'Activitats veterinàries',
  
  // Actividades administrativas y servicios auxiliares (77-82)
  '7711': 'Lloguer d\'automòbils i vehicles de motor lleugers',
  '7712': 'Lloguer de camions',
  '7721': 'Lloguer d\'articles d\'esbarjo i esportius',
  '7722': 'Lloguer de cintes de vídeo i discos',
  '7729': 'Lloguer d\'altres efectes personals i articles d\'ús domèstic',
  '7731': 'Lloguer de maquinària i equips agrícoles',
  '7732': 'Lloguer de maquinària i equips per a la construcció i enginyeria civil',
  '7733': 'Lloguer de maquinària i equips d\'oficina',
  '7734': 'Lloguer de mitjans de navegació',
  '7735': 'Lloguer de mitjans de transport aeri',
  '7739': 'Lloguer d\'altra maquinària, equips i béns tangibles',
  '7740': 'Arrendament de la propietat intel·lectual i productes similars',
  '7810': 'Activitats de les agències de col·locació',
  '7820': 'Activitats de les empreses de treball temporal',
  '7830': 'Altra provisió de recursos humans',
  '7911': 'Activitats de les agències de viatges',
  '7912': 'Activitats dels operadors turístics',
  '7990': 'Altres serveis de reserves i activitats relacionades',
  '8010': 'Activitats de seguretat privada',
  '8020': 'Serveis de sistemes de seguretat',
  '8030': 'Activitats d\'investigació',
  '8110': 'Serveis integrals a edificis i instal·lacions',
  '8121': 'Neteja general d\'edificis',
  '8122': 'Altres activitats de neteja industrial i d\'edificis',
  '8129': 'Altres activitats de neteja',
  '8130': 'Activitats de jardineria',
  '8211': 'Serveis administratius combinats',
  '8219': 'Activitats de fotocopiat, preparació de documents i altres activitats especialitzades d\'oficina',
  '8220': 'Activitats dels centres de trucades',
  '8230': 'Organització de convencions i fires de mostres',
  '8291': 'Activitats de les agències de cobrament i d\'informació comercial',
  '8292': 'Activitats d\'envasat i empaquetatge',
  '8299': 'Altres activitats de suport a les empreses',
  
  // Administración pública y defensa (84)
  '8411': 'Activitats generals de l\'Administració pública',
  '8412': 'Regulació de les activitats sanitàries, educatives i culturals',
  '8413': 'Regulació i facilitació de l\'activitat econòmica',
  '8421': 'Afers exteriors',
  '8422': 'Defensa',
  '8423': 'Justícia',
  '8424': 'Ordre públic i seguretat',
  '8425': 'Protecció civil',
  '8430': 'Seguretat Social obligatòria',
  
  // Educación (85)
  '8510': 'Educació preprimària',
  '8520': 'Educació primària',
  '8531': 'Educació secundària general',
  '8532': 'Educació secundària tècnica i professional',
  '8541': 'Educació postsecundària no superior',
  '8542': 'Educació superior',
  '8543': 'Educació superior',
  '8544': 'Educació universitària i postuniversitària',
  '8551': 'Educació esportiva i recreativa',
  '8552': 'Educació cultural',
  '8553': 'Activitats de les escoles de conducció',
  '8559': 'Altra educació',
  '8560': 'Activitats auxiliars a l\'educació',
  
  // Sanidad y servicios sociales (86-88)
  '8610': 'Activitats hospitalàries',
  '8621': 'Activitats de medicina general',
  '8622': 'Activitats de medicina especialitzada',
  '8623': 'Activitats odontològiques',
  '8690': 'Altres activitats sanitàries',
  '8710': 'Assistència en establiments residencials amb cures sanitàries',
  '8720': 'Assistència en establiments residencials per a persones amb discapacitat intel·lectual',
  '8730': 'Assistència en establiments residencials per a persones grans i amb discapacitat física',
  '8790': 'Altres activitats d\'assistència en establiments residencials',
  '8810': 'Activitats de serveis socials sense allotjament per a persones grans i amb discapacitat',
  '8891': 'Activitats de cura diürna d\'infants',
  '8899': 'Altres activitats de serveis socials sense allotjament',
  
  // Artes, entretenimiento y recreación (90-93)
  '9001': 'Arts escèniques',
  '9002': 'Activitats auxiliars a les arts escèniques',
  '9003': 'Creació artística i literària',
  '9004': 'Gestió de sales d\'espectacles',
  '9102': 'Activitats de museus',
  '9103': 'Gestió de llocs i edificis històrics',
  '9104': 'Activitats dels jardins botànics, parcs zoològics i reserves naturals',
  '9200': 'Activitats de jocs d\'atzar i apostes',
  '9311': 'Gestió d\'instal·lacions esportives',
  '9312': 'Activitats dels clubs esportius',
  '9313': 'Activitats dels gimnasos',
  '9319': 'Altres activitats esportives',
  '9321': 'Activitats dels parcs d\'atraccions i parcs temàtics',
  '9329': 'Altres activitats recreatives i d\'entreteniment',
  
  // Otros servicios (94-96)
  '9411': 'Activitats d\'organitzacions empresarials i patronals',
  '9412': 'Activitats d\'organitzacions professionals',
  '9420': 'Activitats sindicals',
  '9491': 'Activitats d\'organitzacions religioses',
  '9492': 'Activitats d\'organitzacions polítiques',
  '9499': 'Altres activitats associatives',
  '9511': 'Reparació d\'ordinadors i equips perifèrics',
  '9512': 'Reparació d\'equips de comunicació',
  '9521': 'Reparació d\'aparells electrònics d\'àudio i vídeo d\'ús domèstic',
  '9522': 'Reparació d\'aparells electrodomèstics i d\'equipament domèstic i de jardineria',
  '9523': 'Reparació de calçat i articles de cuir',
  '9524': 'Reparació de mobles i articles de parament',
  '9529': 'Reparació d\'altres efectes personals i articles d\'ús domèstic',
  '9601': 'Rentat i neteja de peces tèxtils i de pell',
  '9602': 'Perruqueria i altres tractaments de bellesa',
  '9603': 'Serveis funeraris i activitats relacionades',
  '9604': 'Activitats de manteniment físic',
  '9609': 'Altres serveis personals',
  
  // Actividades de los hogares (97-98)
  '9700': 'Activitats de les llars com a ocupadors de personal domèstic',
  '9810': 'Activitats de les llars que produeixen béns per a ús propi',
  '9820': 'Activitats de les llars que produeixen serveis per a ús propi',
  
  // Organizaciones extraterritoriales (99)
  '9900': 'Activitats d\'organitzacions i organismes extraterritorials'
};

// Categorías de CNAE para filtros y agrupaciones
export const cnaeCategories: Record<string, { name: string; range: [number, number] }> = {
  'agriculture': { name: 'Agricultura, ramaderia, silvicultura i pesca', range: [100, 399] },
  'mining': { name: 'Indústries extractives', range: [500, 999] },
  'manufacturing': { name: 'Indústria manufacturera', range: [1000, 3399] },
  'energy': { name: 'Subministrament d\'energia i aigua', range: [3500, 3999] },
  'construction': { name: 'Construcció', range: [4100, 4399] },
  'commerce': { name: 'Comerç', range: [4500, 4799] },
  'transport': { name: 'Transport i emmagatzematge', range: [4900, 5399] },
  'hospitality': { name: 'Hostaleria', range: [5500, 5699] },
  'information': { name: 'Informació i comunicacions', range: [5800, 6399] },
  'finance': { name: 'Activitats financeres i d\'assegurances', range: [6400, 6699] },
  'real_estate': { name: 'Activitats immobiliàries', range: [6800, 6899] },
  'professional': { name: 'Activitats professionals i tècniques', range: [6900, 7599] },
  'administrative': { name: 'Activitats administratives', range: [7700, 8299] },
  'public': { name: 'Administració pública i defensa', range: [8400, 8499] },
  'education': { name: 'Educació', range: [8500, 8599] },
  'health': { name: 'Sanitat i serveis socials', range: [8600, 8899] },
  'arts': { name: 'Arts, entreteniment i oci', range: [9000, 9399] },
  'other_services': { name: 'Altres serveis', range: [9400, 9699] },
  'household': { name: 'Activitats de les llars', range: [9700, 9899] },
  'extraterritorial': { name: 'Organismes extraterritorials', range: [9900, 9999] }
};

export function getCnaeDescription(cnaeCode: string | null | undefined): string {
  if (!cnaeCode) return '';
  
  // Remove any non-numeric characters and get first 4 digits
  const cleanCode = cnaeCode.replace(/\D/g, '').slice(0, 4);
  
  return cnaeDescriptions[cleanCode] || '';
}

export function formatCnaeWithDescription(cnaeCode: string | null | undefined): string {
  if (!cnaeCode) return '';
  
  const description = getCnaeDescription(cnaeCode);
  
  if (description) {
    return `${cnaeCode} - ${description}`;
  }
  
  return cnaeCode;
}

export function getCnaeCategory(cnaeCode: string | null | undefined): string | null {
  if (!cnaeCode) return null;
  
  const cleanCode = parseInt(cnaeCode.replace(/\D/g, '').slice(0, 4), 10);
  if (isNaN(cleanCode)) return null;
  
  for (const [key, { range }] of Object.entries(cnaeCategories)) {
    if (cleanCode >= range[0] && cleanCode <= range[1]) {
      return key;
    }
  }
  
  return null;
}

export function getCnaeCategoryName(cnaeCode: string | null | undefined): string {
  const category = getCnaeCategory(cnaeCode);
  if (!category) return '';
  return cnaeCategories[category]?.name || '';
}

export function searchCnaeCodes(query: string): Array<{ code: string; description: string }> {
  if (!query || query.length < 2) return [];
  
  const searchLower = query.toLowerCase();
  const results: Array<{ code: string; description: string }> = [];
  
  for (const [code, description] of Object.entries(cnaeDescriptions)) {
    if (code.includes(query) || description.toLowerCase().includes(searchLower)) {
      results.push({ code, description });
    }
    if (results.length >= 20) break; // Limit results
  }
  
  return results;
}

export function getCnaeDescription(cnaeCode: string | null | undefined): string {
  if (!cnaeCode) return '';
  
  // Remove any non-numeric characters and get first 4 digits
  const cleanCode = cnaeCode.replace(/\D/g, '').slice(0, 4);
  
  return cnaeDescriptions[cleanCode] || '';
}

export function formatCnaeWithDescription(cnaeCode: string | null | undefined): string {
  if (!cnaeCode) return '';
  
  const description = getCnaeDescription(cnaeCode);
  
  if (description) {
    return `${cnaeCode} - ${description}`;
  }
  
  return cnaeCode;
}
