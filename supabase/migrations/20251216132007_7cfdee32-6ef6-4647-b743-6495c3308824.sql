
-- Limpiar datos existentes para insertar mapeo completo
DELETE FROM public.cnae_sector_mapping;

-- Insertar TODOS los sectores predominantes en España con sus códigos CNAE
INSERT INTO public.cnae_sector_mapping (cnae_code, cnae_description, sector, sector_name, default_kpis, default_regulations) VALUES

-- ═══════════════════════════════════════════════════════════════════════════════
-- AGRICULTURA, GANADERÍA, SILVICULTURA Y PESCA (01-03) - Sector primario importante
-- ═══════════════════════════════════════════════════════════════════════════════
('0111', 'Cultivo de cereales', 'agriculture', 'Agricultura i Ramaderia', ARRAY['hectareas_cultivadas', 'rendimiento_toneladas', 'subvenciones_pac'], ARRAY['PAC', 'Normativa fitosanitaria']),
('0113', 'Cultivo de hortalizas', 'agriculture', 'Agricultura i Ramaderia', ARRAY['hectareas_cultivadas', 'produccion_kg', 'exportaciones'], ARRAY['PAC', 'Seguridad alimentaria']),
('0121', 'Cultivo de la vid', 'agriculture', 'Agricultura i Ramaderia', ARRAY['hectareas_vinedo', 'produccion_litros', 'denominacion_origen'], ARRAY['PAC', 'DO Vinos']),
('0124', 'Cultivo de frutos con hueso', 'agriculture', 'Agricultura i Ramaderia', ARRAY['produccion_toneladas', 'exportaciones', 'certificaciones'], ARRAY['PAC', 'GlobalGAP']),
('0125', 'Cultivo de otros frutos', 'agriculture', 'Agricultura i Ramaderia', ARRAY['produccion_toneladas', 'superficie', 'rendimiento'], ARRAY['PAC', 'Certificaciones eco']),
('0126', 'Cultivo de frutos oleaginosos', 'agriculture', 'Agricultura i Ramaderia', ARRAY['produccion_aceite', 'hectareas_olivar', 'calidad_aceite'], ARRAY['PAC', 'DO Aceite']),
('0141', 'Explotación de ganado bovino', 'agriculture', 'Agricultura i Ramaderia', ARRAY['cabezas_ganado', 'produccion_leche', 'trazabilidad'], ARRAY['Sanidad animal', 'Bienestar animal']),
('0145', 'Explotación de ganado ovino y caprino', 'agriculture', 'Agricultura i Ramaderia', ARRAY['cabezas_ganado', 'produccion_lana', 'carne'], ARRAY['Sanidad animal', 'PAC']),
('0146', 'Explotación de ganado porcino', 'agriculture', 'Agricultura i Ramaderia', ARRAY['cabezas_ganado', 'produccion_carne', 'exportaciones'], ARRAY['Sanidad animal', 'Trazabilidad']),
('0147', 'Avicultura', 'agriculture', 'Agricultura i Ramaderia', ARRAY['produccion_huevos', 'produccion_carne', 'bienestar_animal'], ARRAY['Sanidad animal', 'Bienestar animal']),
('0311', 'Pesca marítima', 'agriculture', 'Agricultura i Ramaderia', ARRAY['capturas_toneladas', 'cuotas_pesca', 'dias_mar'], ARRAY['PPC', 'Cuotas pesqueras']),
('0321', 'Acuicultura marina', 'agriculture', 'Agricultura i Ramaderia', ARRAY['produccion_toneladas', 'especies', 'instalaciones'], ARRAY['Acuicultura', 'Medio ambiente']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDUSTRIA ALIMENTARIA (10-12) - Muy importante en España
-- ═══════════════════════════════════════════════════════════════════════════════
('1011', 'Procesado y conservación de carne', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_toneladas', 'exportaciones', 'certificaciones_calidad'], ARRAY['Seguridad alimentaria', 'HACCP', 'IFS']),
('1013', 'Elaboración de productos cárnicos', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_embutidos', 'denominaciones_origen', 'exportaciones'], ARRAY['HACCP', 'IFS', 'DO Jamón']),
('1020', 'Procesado de pescados', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_conservas', 'exportaciones', 'trazabilidad'], ARRAY['HACCP', 'MSC']),
('1039', 'Otro procesado de frutas y hortalizas', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_toneladas', 'exportaciones', 'certificaciones'], ARRAY['HACCP', 'BRC', 'IFS']),
('1041', 'Fabricación de aceites', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_litros', 'calidad_aceite', 'exportaciones'], ARRAY['DO Aceite', 'HACCP']),
('1051', 'Preparación de leche', 'food_industry', 'Indústria Alimentària', ARRAY['litros_procesados', 'productos_lacteos', 'exportaciones'], ARRAY['HACCP', 'Seguridad alimentaria']),
('1061', 'Fabricación de productos de molinería', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_harina', 'clientes_panaderias', 'calidad'], ARRAY['HACCP', 'Seguridad alimentaria']),
('1071', 'Fabricación de pan', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_unidades', 'puntos_venta', 'variedades'], ARRAY['HACCP', 'Seguridad alimentaria']),
('1072', 'Fabricación de galletas y pastelería', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_toneladas', 'exportaciones', 'innovacion'], ARRAY['HACCP', 'IFS', 'BRC']),
('1081', 'Fabricación de azúcar', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_toneladas', 'remolacha_procesada'], ARRAY['PAC', 'HACCP']),
('1082', 'Fabricación de cacao y chocolate', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_toneladas', 'exportaciones', 'marcas'], ARRAY['HACCP', 'Comercio justo']),
('1085', 'Elaboración de platos preparados', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_unidades', 'canales_distribucion', 'innovacion'], ARRAY['HACCP', 'Etiquetado']),
('1089', 'Elaboración de otros productos alimenticios', 'food_industry', 'Indústria Alimentària', ARRAY['produccion', 'diversificacion', 'exportaciones'], ARRAY['HACCP', 'Seguridad alimentaria']),
('1101', 'Destilación de bebidas alcohólicas', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_litros', 'exportaciones', 'denominaciones'], ARRAY['Impuestos especiales', 'DO']),
('1102', 'Elaboración de vinos', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_litros', 'exportaciones', 'denominaciones_origen'], ARRAY['DO Vinos', 'OCM Vino']),
('1105', 'Fabricación de cerveza', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_hectolitros', 'cuota_mercado', 'marcas'], ARRAY['Impuestos especiales', 'HACCP']),
('1107', 'Fabricación de bebidas no alcohólicas', 'food_industry', 'Indústria Alimentària', ARRAY['produccion_litros', 'cuota_mercado', 'innovacion'], ARRAY['HACCP', 'Etiquetado']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDUSTRIA TEXTIL Y MODA (13-15) - Tradicional en España
-- ═══════════════════════════════════════════════════════════════════════════════
('1320', 'Fabricación de tejidos textiles', 'textile', 'Tèxtil i Moda', ARRAY['metros_producidos', 'exportaciones', 'clientes'], ARRAY['REACH', 'Etiquetado textil']),
('1392', 'Fabricación de artículos confeccionados', 'textile', 'Tèxtil i Moda', ARRAY['unidades_producidas', 'clientes', 'exportaciones'], ARRAY['Etiquetado textil', 'Sostenibilidad']),
('1413', 'Confección de otras prendas exteriores', 'textile', 'Tèxtil i Moda', ARRAY['colecciones_ano', 'puntos_venta', 'exportaciones'], ARRAY['Etiquetado textil', 'RSC']),
('1419', 'Confección de otras prendas de vestir', 'textile', 'Tèxtil i Moda', ARRAY['unidades_producidas', 'canales_venta', 'marcas'], ARRAY['Etiquetado', 'Sostenibilidad']),
('1420', 'Fabricación de artículos de peletería', 'textile', 'Tèxtil i Moda', ARRAY['produccion', 'exportaciones', 'calidad'], ARRAY['CITES', 'Bienestar animal']),
('1431', 'Confección de calcetería', 'textile', 'Tèxtil i Moda', ARRAY['pares_producidos', 'clientes', 'exportaciones'], ARRAY['Etiquetado textil']),
('1511', 'Preparación de cueros', 'textile', 'Tèxtil i Moda', ARRAY['pieles_procesadas', 'calidad', 'certificaciones'], ARRAY['REACH', 'Medio ambiente']),
('1520', 'Fabricación de calzado', 'textile', 'Tèxtil i Moda', ARRAY['pares_producidos', 'exportaciones', 'marcas'], ARRAY['Etiquetado', 'REACH']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDUSTRIA QUÍMICA Y FARMACÉUTICA (20-21) - Alto valor añadido
-- ═══════════════════════════════════════════════════════════════════════════════
('2011', 'Fabricación de gases industriales', 'chemical', 'Indústria Química', ARRAY['produccion_m3', 'clientes_industriales', 'seguridad'], ARRAY['REACH', 'Seveso']),
('2012', 'Fabricación de colorantes y pigmentos', 'chemical', 'Indústria Química', ARRAY['produccion_toneladas', 'clientes', 'I+D'], ARRAY['REACH', 'CLP']),
('2014', 'Fabricación de otros productos químicos', 'chemical', 'Indústria Química', ARRAY['produccion', 'exportaciones', 'certificaciones'], ARRAY['REACH', 'ISO 14001']),
('2020', 'Fabricación de pesticidas', 'chemical', 'Indústria Química', ARRAY['produccion', 'registros_productos', 'mercado'], ARRAY['Fitosanitarios', 'REACH']),
('2030', 'Fabricación de pinturas y barnices', 'chemical', 'Indústria Química', ARRAY['produccion_litros', 'cuota_mercado', 'innovacion'], ARRAY['COV', 'REACH']),
('2041', 'Fabricación de jabones y detergentes', 'chemical', 'Indústria Química', ARRAY['produccion', 'marcas', 'cuota_mercado'], ARRAY['Detergentes', 'REACH']),
('2042', 'Fabricación de perfumes y cosméticos', 'chemical', 'Indústria Química', ARRAY['produccion', 'exportaciones', 'marcas'], ARRAY['Cosméticos', 'GMP']),
('2110', 'Fabricación de productos farmacéuticos', 'pharma', 'Indústria Farmacèutica', ARRAY['produccion_unidades', 'I+D_inversion', 'patentes'], ARRAY['GMP', 'EMA', 'AEMPS']),
('2120', 'Fabricación de especialidades farmacéuticas', 'pharma', 'Indústria Farmacèutica', ARRAY['medicamentos_registrados', 'exportaciones', 'ensayos_clinicos'], ARRAY['GMP', 'Farmacovigilancia']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDUSTRIA DEL METAL Y MAQUINARIA (24-28) - Base industrial
-- ═══════════════════════════════════════════════════════════════════════════════
('2410', 'Fabricación de productos básicos de hierro', 'metal', 'Metal i Maquinària', ARRAY['produccion_toneladas', 'clientes', 'exportaciones'], ARRAY['ISO 9001', 'Medio ambiente']),
('2511', 'Fabricación de estructuras metálicas', 'metal', 'Metal i Maquinària', ARRAY['toneladas_fabricadas', 'proyectos', 'certificaciones'], ARRAY['EN 1090', 'ISO 3834']),
('2529', 'Fabricación de otros depósitos metálicos', 'metal', 'Metal i Maquinària', ARRAY['unidades_producidas', 'clientes', 'sectores'], ARRAY['Equipos a presión', 'ISO 9001']),
('2561', 'Tratamiento de metales', 'metal', 'Metal i Maquinària', ARRAY['piezas_tratadas', 'procesos', 'clientes'], ARRAY['REACH', 'Medio ambiente']),
('2562', 'Ingeniería mecánica por cuenta de terceros', 'metal', 'Metal i Maquinària', ARRAY['proyectos', 'facturacion', 'clientes'], ARRAY['ISO 9001', 'Certificaciones']),
('2571', 'Fabricación de artículos de cuchillería', 'metal', 'Metal i Maquinària', ARRAY['unidades_producidas', 'exportaciones', 'marcas'], ARRAY['Seguridad producto']),
('2593', 'Fabricación de productos de alambre', 'metal', 'Metal i Maquinària', ARRAY['produccion_toneladas', 'clientes', 'aplicaciones'], ARRAY['ISO 9001']),
('2599', 'Fabricación de otros productos metálicos', 'metal', 'Metal i Maquinària', ARRAY['produccion', 'diversificacion', 'clientes'], ARRAY['ISO 9001', 'Certificaciones']),
('2611', 'Fabricación de componentes electrónicos', 'electronics', 'Electrònica', ARRAY['unidades_producidas', 'clientes', 'I+D'], ARRAY['RoHS', 'WEEE', 'CE']),
('2620', 'Fabricación de ordenadores', 'electronics', 'Electrònica', ARRAY['unidades_producidas', 'cuota_mercado', 'innovacion'], ARRAY['RoHS', 'WEEE', 'Ecodiseño']),
('2630', 'Fabricación de equipos de telecomunicaciones', 'electronics', 'Electrònica', ARRAY['productos', 'I+D', 'patentes'], ARRAY['CE', 'RED', 'EMC']),
('2640', 'Fabricación de productos electrónicos de consumo', 'electronics', 'Electrònica', ARRAY['unidades_vendidas', 'cuota_mercado', 'innovacion'], ARRAY['RoHS', 'WEEE', 'CE']),
('2711', 'Fabricación de motores eléctricos', 'electronics', 'Electrònica', ARRAY['unidades_producidas', 'eficiencia', 'clientes'], ARRAY['Ecodiseño', 'CE']),
('2812', 'Fabricación de equipos de fluidos', 'metal', 'Metal i Maquinària', ARRAY['unidades', 'clientes', 'sectores'], ARRAY['PED', 'ATEX']),
('2822', 'Fabricación de maquinaria de elevación', 'metal', 'Metal i Maquinària', ARRAY['equipos_instalados', 'mantenimientos', 'seguridad'], ARRAY['Maquinaria', 'CE']),
('2825', 'Fabricación de maquinaria de refrigeración', 'metal', 'Metal i Maquinària', ARRAY['equipos_vendidos', 'eficiencia', 'servicio'], ARRAY['F-Gas', 'Ecodiseño']),
('2829', 'Fabricación de otra maquinaria', 'metal', 'Metal i Maquinària', ARRAY['produccion', 'clientes', 'I+D'], ARRAY['Maquinaria', 'CE']),
('2892', 'Fabricación de maquinaria minería y construcción', 'metal', 'Metal i Maquinària', ARRAY['equipos_vendidos', 'servicio_postventa', 'exportaciones'], ARRAY['Maquinaria', 'Seguridad']),
('2893', 'Fabricación de maquinaria alimentaria', 'metal', 'Metal i Maquinària', ARRAY['equipos', 'clientes_alimentarios', 'higiene'], ARRAY['Maquinaria', 'Contacto alimentos']),
('2910', 'Fabricación de vehículos de motor', 'automotive', 'Automoció', ARRAY['vehiculos_producidos', 'exportaciones', 'empleo'], ARRAY['Homologación', 'Emisiones', 'IATF']),
('2920', 'Fabricación de carrocerías', 'automotive', 'Automoció', ARRAY['unidades_producidas', 'clientes', 'tipos'], ARRAY['Homologación', 'CE']),
('2931', 'Fabricación de equipos eléctricos para vehículos', 'automotive', 'Automoció', ARRAY['componentes', 'clientes_OEM', 'I+D'], ARRAY['IATF', 'ISO 9001']),
('2932', 'Fabricación de otros componentes para vehículos', 'automotive', 'Automoció', ARRAY['componentes', 'clientes_OEM', 'exportaciones'], ARRAY['IATF', 'ISO 9001']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDUSTRIA DEL MUEBLE Y MADERA (16, 31) - Tradicional español
-- ═══════════════════════════════════════════════════════════════════════════════
('1610', 'Aserrado y cepillado de la madera', 'wood_furniture', 'Fusta i Mobiliari', ARRAY['m3_procesados', 'clientes', 'certificaciones'], ARRAY['FSC', 'PEFC', 'EUTR']),
('1621', 'Fabricación de chapas y tableros', 'wood_furniture', 'Fusta i Mobiliari', ARRAY['m2_producidos', 'clientes', 'calidad'], ARRAY['FSC', 'PEFC', 'E1']),
('1623', 'Fabricación de otras estructuras de madera', 'wood_furniture', 'Fusta i Mobiliari', ARRAY['proyectos', 'clientes', 'certificaciones'], ARRAY['CE Estructuras', 'FSC']),
('1629', 'Fabricación de otros productos de madera', 'wood_furniture', 'Fusta i Mobiliari', ARRAY['produccion', 'clientes', 'diversificacion'], ARRAY['FSC', 'CE']),
('3101', 'Fabricación de muebles de oficina', 'wood_furniture', 'Fusta i Mobiliari', ARRAY['unidades_vendidas', 'clientes_empresas', 'diseno'], ARRAY['Ergonomía', 'FSC']),
('3102', 'Fabricación de muebles de cocina', 'wood_furniture', 'Fusta i Mobiliari', ARRAY['cocinas_instaladas', 'distribuidores', 'diseno'], ARRAY['CE', 'Formaldehído']),
('3103', 'Fabricación de colchones', 'wood_furniture', 'Fusta i Mobiliari', ARRAY['unidades_vendidas', 'cuota_mercado', 'innovacion'], ARRAY['Seguridad producto', 'Etiquetado']),
('3109', 'Fabricación de otros muebles', 'wood_furniture', 'Fusta i Mobiliari', ARRAY['unidades_producidas', 'canales_venta', 'diseno'], ARRAY['CE', 'FSC']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- CONSTRUCCIÓN (41-43) - Sector clave en España
-- ═══════════════════════════════════════════════════════════════════════════════
('4110', 'Promoción inmobiliaria', 'construction', 'Construcció', ARRAY['viviendas_promovidas', 'facturacion', 'proyectos_activos'], ARRAY['LOE', 'Urbanismo', 'CTE']),
('4121', 'Construcción de edificios residenciales', 'construction', 'Construcció', ARRAY['viviendas_construidas', 'm2_construidos', 'certificaciones'], ARRAY['CTE', 'LOE', 'PRL']),
('4122', 'Construcción de edificios no residenciales', 'construction', 'Construcció', ARRAY['m2_construidos', 'proyectos', 'sectores'], ARRAY['CTE', 'LOE', 'PRL']),
('4211', 'Construcción de carreteras', 'construction', 'Construcció', ARRAY['km_construidos', 'licitaciones', 'maquinaria'], ARRAY['PRL', 'Medio ambiente', 'Carreteras']),
('4212', 'Construcción de vías férreas', 'construction', 'Construcció', ARRAY['km_construidos', 'proyectos', 'tecnologia'], ARRAY['Ferroviario', 'PRL', 'Seguridad']),
('4221', 'Construcción de redes de abastecimiento', 'construction', 'Construcció', ARRAY['km_red', 'proyectos', 'clientes_publicos'], ARRAY['Aguas', 'PRL', 'Medio ambiente']),
('4222', 'Construcción de redes eléctricas', 'construction', 'Construcció', ARRAY['km_red', 'proyectos', 'seguridad'], ARRAY['REBT', 'PRL', 'Autorizaciones']),
('4291', 'Obras hidráulicas', 'construction', 'Construcció', ARRAY['proyectos', 'capacidad', 'clientes'], ARRAY['Aguas', 'DIA', 'PRL']),
('4299', 'Construcción de otros proyectos', 'construction', 'Construcció', ARRAY['proyectos', 'facturacion', 'diversificacion'], ARRAY['PRL', 'Medio ambiente']),
('4311', 'Demolición', 'construction', 'Construcció', ARRAY['proyectos', 'toneladas_gestionadas', 'reciclaje'], ARRAY['Residuos', 'PRL', 'Amianto']),
('4312', 'Preparación de terrenos', 'construction', 'Construcció', ARRAY['m3_movidos', 'proyectos', 'maquinaria'], ARRAY['PRL', 'Medio ambiente']),
('4321', 'Instalaciones eléctricas', 'construction', 'Construcció', ARRAY['instalaciones', 'mantenimientos', 'certificaciones'], ARRAY['REBT', 'PRL', 'Instaladores']),
('4322', 'Fontanería y climatización', 'construction', 'Construcció', ARRAY['instalaciones', 'mantenimientos', 'eficiencia'], ARRAY['RITE', 'PRL', 'F-Gas']),
('4329', 'Otras instalaciones', 'construction', 'Construcció', ARRAY['instalaciones', 'clientes', 'sectores'], ARRAY['PRL', 'Reglamentos técnicos']),
('4331', 'Revocamiento', 'construction', 'Construcció', ARRAY['m2_ejecutados', 'proyectos', 'equipo'], ARRAY['PRL', 'CTE']),
('4332', 'Instalación de carpintería', 'construction', 'Construcció', ARRAY['instalaciones', 'clientes', 'materiales'], ARRAY['CE Ventanas', 'PRL']),
('4333', 'Revestimiento de suelos y paredes', 'construction', 'Construcció', ARRAY['m2_instalados', 'proyectos', 'materiales'], ARRAY['PRL', 'CE']),
('4334', 'Pintura y acristalamiento', 'construction', 'Construcció', ARRAY['m2_pintados', 'proyectos', 'clientes'], ARRAY['PRL', 'COV']),
('4339', 'Otro acabado de edificios', 'construction', 'Construcció', ARRAY['proyectos', 'clientes', 'especializacion'], ARRAY['PRL', 'CTE']),
('4391', 'Construcción de cubiertas', 'construction', 'Construcció', ARRAY['m2_instalados', 'proyectos', 'impermeabilizacion'], ARRAY['PRL', 'CTE']),
('4399', 'Otras actividades de construcción', 'construction', 'Construcció', ARRAY['proyectos', 'facturacion', 'especializacion'], ARRAY['PRL', 'Reglamentos']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMERCIO AL POR MAYOR (46) - Intermediación fundamental
-- ═══════════════════════════════════════════════════════════════════════════════
('4611', 'Intermediarios de materias primas agrarias', 'wholesale', 'Comerç a l''Engròs', ARRAY['volumen_intermediado', 'clientes', 'margenes'], ARRAY['Trazabilidad', 'Contratos']),
('4617', 'Intermediarios de productos alimenticios', 'wholesale', 'Comerç a l''Engròs', ARRAY['facturacion', 'clientes', 'productos'], ARRAY['Seguridad alimentaria', 'Trazabilidad']),
('4618', 'Intermediarios especializados', 'wholesale', 'Comerç a l''Engròs', ARRAY['operaciones', 'clientes', 'sectores'], ARRAY['Contratos mercantiles']),
('4621', 'Comercio al por mayor de cereales', 'wholesale', 'Comerç a l''Engròs', ARRAY['toneladas_comercializadas', 'clientes', 'almacenamiento'], ARRAY['PAC', 'Trazabilidad']),
('4631', 'Comercio al por mayor de frutas y hortalizas', 'wholesale', 'Comerç a l''Engròs', ARRAY['toneladas', 'clientes_retail', 'frescura'], ARRAY['Seguridad alimentaria', 'Trazabilidad']),
('4632', 'Comercio al por mayor de carne', 'wholesale', 'Comerç a l''Engròs', ARRAY['toneladas', 'clientes', 'cadena_frio'], ARRAY['Sanidad', 'Trazabilidad', 'HACCP']),
('4634', 'Comercio al por mayor de bebidas', 'wholesale', 'Comerç a l''Engròs', ARRAY['hectolitros', 'marcas_distribuidas', 'clientes'], ARRAY['Impuestos especiales', 'Licencias']),
('4637', 'Comercio al por mayor de café y té', 'wholesale', 'Comerç a l''Engròs', ARRAY['toneladas', 'clientes_horeca', 'marcas'], ARRAY['Seguridad alimentaria']),
('4638', 'Comercio al por mayor de pescados', 'wholesale', 'Comerç a l''Engròs', ARRAY['toneladas', 'clientes', 'cadena_frio'], ARRAY['Trazabilidad', 'Sanidad']),
('4639', 'Comercio al por mayor alimenticio no especializado', 'wholesale', 'Comerç a l''Engròs', ARRAY['facturacion', 'referencias', 'clientes'], ARRAY['Seguridad alimentaria', 'Trazabilidad']),
('4641', 'Comercio al por mayor de textiles', 'wholesale', 'Comerç a l''Engròs', ARRAY['facturacion', 'clientes', 'colecciones'], ARRAY['Etiquetado textil']),
('4642', 'Comercio al por mayor de prendas de vestir', 'wholesale', 'Comerç a l''Engròs', ARRAY['unidades', 'marcas', 'clientes_retail'], ARRAY['Etiquetado', 'Aduanas']),
('4643', 'Comercio al por mayor de electrodomésticos', 'wholesale', 'Comerç a l''Engròs', ARRAY['unidades', 'marcas', 'clientes'], ARRAY['RAEE', 'Eficiencia energética']),
('4645', 'Comercio al por mayor de perfumería', 'wholesale', 'Comerç a l''Engròs', ARRAY['facturacion', 'marcas', 'canales'], ARRAY['Cosméticos', 'Selectiva']),
('4646', 'Comercio al por mayor farmacéutico', 'wholesale', 'Comerç a l''Engròs', ARRAY['referencias', 'farmacias_cliente', 'servicio'], ARRAY['GDP', 'Trazabilidad medicamentos']),
('4649', 'Comercio al por mayor de otros artículos uso doméstico', 'wholesale', 'Comerç a l''Engròs', ARRAY['facturacion', 'referencias', 'clientes'], ARRAY['Seguridad producto', 'CE']),
('4651', 'Comercio al por mayor de equipos informáticos', 'wholesale', 'Comerç a l''Engròs', ARRAY['unidades', 'marcas', 'valor_añadido'], ARRAY['RAEE', 'Protección datos']),
('4652', 'Comercio al por mayor de equipos electrónicos', 'wholesale', 'Comerç a l''Engròs', ARRAY['facturacion', 'marcas', 'clientes'], ARRAY['RAEE', 'CE']),
('4661', 'Comercio al por mayor de maquinaria agrícola', 'wholesale', 'Comerç a l''Engròs', ARRAY['unidades', 'servicio_postventa', 'financiacion'], ARRAY['Maquinaria', 'CE']),
('4662', 'Comercio al por mayor de máquinas herramienta', 'wholesale', 'Comerç a l''Engròs', ARRAY['facturacion', 'clientes_industriales', 'servicio'], ARRAY['CE', 'Seguridad máquinas']),
('4663', 'Comercio al por mayor de maquinaria minería', 'wholesale', 'Comerç a l''Engròs', ARRAY['equipos', 'recambios', 'servicio'], ARRAY['Maquinaria', 'Seguridad']),
('4669', 'Comercio al por mayor de otra maquinaria', 'wholesale', 'Comerç a l''Engròs', ARRAY['facturacion', 'sectores', 'clientes'], ARRAY['CE', 'Garantías']),
('4671', 'Comercio al por mayor de combustibles', 'wholesale', 'Comerç a l''Engròs', ARRAY['litros', 'estaciones_servidas', 'logistica'], ARRAY['CLH', 'Hidrocarburos', 'ADR']),
('4672', 'Comercio al por mayor de metales', 'wholesale', 'Comerç a l''Engròs', ARRAY['toneladas', 'clientes', 'almacenes'], ARRAY['Medio ambiente', 'REACH']),
('4673', 'Comercio al por mayor de madera y materiales', 'wholesale', 'Comerç a l''Engròs', ARRAY['facturacion', 'referencias', 'clientes_construccion'], ARRAY['FSC', 'CE Construcción']),
('4674', 'Comercio al por mayor de ferretería', 'wholesale', 'Comerç a l''Engròs', ARRAY['referencias', 'clientes', 'logistica'], ARRAY['CE', 'Seguridad producto']),
('4675', 'Comercio al por mayor de productos químicos', 'wholesale', 'Comerç a l''Engròs', ARRAY['toneladas', 'clientes', 'seguridad'], ARRAY['REACH', 'ADR', 'Seveso']),
('4676', 'Comercio al por mayor de productos semielaborados', 'wholesale', 'Comerç a l''Engròs', ARRAY['facturacion', 'clientes_industriales', 'logistica'], ARRAY['CE', 'Especificaciones']),
('4677', 'Comercio al por mayor de chatarra', 'wholesale', 'Comerç a l''Engròs', ARRAY['toneladas', 'clientes', 'autorizaciones'], ARRAY['Residuos', 'Medio ambiente']),
('4690', 'Comercio al por mayor no especializado', 'wholesale', 'Comerç a l''Engròs', ARRAY['facturacion', 'lineas_producto', 'clientes'], ARRAY['Varias normativas']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMERCIO MINORISTA (47) - Mayor número de empresas en España
-- ═══════════════════════════════════════════════════════════════════════════════
('4711', 'Comercio en establecimientos no especializados', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'm2_sala_ventas', 'ticket_medio'], ARRAY['Consumidores', 'Etiquetado', 'Precios']),
('4719', 'Otro comercio en establecimientos no especializados', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'clientes', 'productos'], ARRAY['Consumidores', 'Etiquetado']),
('4721', 'Comercio al por menor de frutas y hortalizas', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'clientes_diarios', 'proveedores'], ARRAY['Seguridad alimentaria', 'Etiquetado']),
('4722', 'Comercio al por menor de carne', 'retail', 'Comerç Minorista', ARRAY['kg_vendidos', 'clientes', 'calidad'], ARRAY['Sanidad', 'Trazabilidad']),
('4723', 'Comercio al por menor de pescados', 'retail', 'Comerç Minorista', ARRAY['kg_vendidos', 'clientes', 'frescura'], ARRAY['Sanidad', 'Trazabilidad', 'Etiquetado']),
('4724', 'Comercio al por menor de pan y pastelería', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'clientes_diarios', 'productos'], ARRAY['Seguridad alimentaria', 'Alérgenos']),
('4725', 'Comercio al por menor de bebidas', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'referencias', 'clientes'], ARRAY['Licencias alcohol', 'Reciclaje']),
('4726', 'Comercio al por menor de tabaco', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'comision', 'servicios_adicionales'], ARRAY['Monopolio tabaco', 'Publicidad']),
('4729', 'Otro comercio de alimentación', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'especialidad', 'clientes'], ARRAY['Seguridad alimentaria', 'Etiquetado']),
('4741', 'Comercio al por menor de equipos informáticos', 'retail', 'Comerç Minorista', ARRAY['unidades', 'ticket_medio', 'servicios'], ARRAY['RAEE', 'Garantías', 'Consumidores']),
('4742', 'Comercio al por menor de equipos telecomunicaciones', 'retail', 'Comerç Minorista', ARRAY['terminales_vendidos', 'contratos', 'servicios'], ARRAY['Telecomunicaciones', 'Consumidores']),
('4743', 'Comercio al por menor de equipos de audio y vídeo', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'ticket_medio', 'instalaciones'], ARRAY['RAEE', 'CE', 'Garantías']),
('4751', 'Comercio al por menor de textiles', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'metros_vendidos', 'clientes'], ARRAY['Etiquetado textil']),
('4752', 'Comercio de ferretería y materiales', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'referencias', 'clientes'], ARRAY['Seguridad producto', 'Fitosanitarios']),
('4753', 'Comercio de alfombras y revestimientos', 'retail', 'Comerç Minorista', ARRAY['m2_vendidos', 'instalaciones', 'clientes'], ARRAY['CE', 'Etiquetado']),
('4754', 'Comercio de electrodomésticos', 'retail', 'Comerç Minorista', ARRAY['unidades', 'ticket_medio', 'servicio_tecnico'], ARRAY['Eficiencia energética', 'RAEE', 'Garantías']),
('4759', 'Comercio de muebles y otros artículos hogar', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'ticket_medio', 'entregas'], ARRAY['Seguridad producto', 'Consumidores']),
('4761', 'Comercio de libros', 'retail', 'Comerç Minorista', ARRAY['unidades', 'titulo_medio', 'eventos'], ARRAY['Precio fijo libros', 'IVA reducido']),
('4762', 'Comercio de periódicos y papelería', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'servicios', 'clientes'], ARRAY['Distribución prensa']),
('4763', 'Comercio de grabaciones música y vídeo', 'retail', 'Comerç Minorista', ARRAY['unidades', 'streaming', 'merchandising'], ARRAY['Propiedad intelectual', 'SGAE']),
('4764', 'Comercio de artículos deportivos', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'categorias', 'servicios'], ARRAY['Seguridad producto', 'CE']),
('4765', 'Comercio de juegos y juguetes', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'estacionalidad', 'referencias'], ARRAY['Seguridad juguetes', 'CE']),
('4771', 'Comercio de prendas de vestir', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'ticket_medio', 'rotacion'], ARRAY['Etiquetado textil', 'Consumidores']),
('4772', 'Comercio de calzado', 'retail', 'Comerç Minorista', ARRAY['pares_vendidos', 'ticket_medio', 'temporadas'], ARRAY['Etiquetado', 'Consumidores']),
('4773', 'Comercio de productos farmacéuticos', 'retail', 'Comerç Minorista', ARRAY['recetas', 'parafarmacia', 'servicios'], ARRAY['Farmacia', 'Medicamentos', 'Sanidad']),
('4774', 'Comercio de artículos médicos', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'productos_sanitarios', 'servicios'], ARRAY['Productos sanitarios', 'CE']),
('4775', 'Comercio de cosméticos', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'marcas', 'ticket_medio'], ARRAY['Cosméticos', 'Etiquetado']),
('4776', 'Comercio de flores y plantas', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'eventos', 'fidelizacion'], ARRAY['Fitosanitario', 'CITES']),
('4777', 'Comercio de relojería y joyería', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'ticket_medio', 'servicios'], ARRAY['Metales preciosos', 'Blanqueo']),
('4778', 'Otro comercio de artículos nuevos', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'especialidad', 'clientes'], ARRAY['Consumidores', 'Seguridad producto']),
('4779', 'Comercio de artículos de segunda mano', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'rotacion', 'valoracion'], ARRAY['Segunda mano', 'Garantías']),
('4781', 'Comercio en puestos de venta de alimentación', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'mercados', 'clientes'], ARRAY['Seguridad alimentaria', 'Mercados']),
('4782', 'Comercio en puestos de textil y calzado', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'mercadillos', 'productos'], ARRAY['Venta ambulante', 'Etiquetado']),
('4789', 'Comercio en puestos de otros productos', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'mercados', 'productos'], ARRAY['Venta ambulante', 'Licencias']),
('4791', 'Comercio por correspondencia o internet', 'retail', 'Comerç Minorista', ARRAY['pedidos', 'facturacion', 'conversion'], ARRAY['E-commerce', 'LOPD', 'Consumidores']),
('4799', 'Otro comercio no realizado en establecimientos', 'retail', 'Comerç Minorista', ARRAY['facturacion', 'canal', 'clientes'], ARRAY['Consumidores', 'Licencias']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRANSPORTE Y LOGÍSTICA (49-53) - Vertebrador economía
-- ═══════════════════════════════════════════════════════════════════════════════
('4910', 'Transporte interurbano de pasajeros por ferrocarril', 'transport', 'Transport i Logística', ARRAY['pasajeros', 'km_recorridos', 'puntualidad'], ARRAY['Ferroviario', 'Seguridad', 'Accesibilidad']),
('4931', 'Transporte terrestre urbano de pasajeros', 'transport', 'Transport i Logística', ARRAY['pasajeros', 'lineas', 'flota'], ARRAY['Transporte público', 'Accesibilidad']),
('4932', 'Transporte por taxi', 'transport', 'Transport i Logística', ARRAY['servicios', 'km_recorridos', 'valoracion'], ARRAY['Licencias taxi', 'VTC']),
('4939', 'Otro transporte terrestre de pasajeros', 'transport', 'Transport i Logística', ARRAY['pasajeros', 'rutas', 'flota'], ARRAY['Autorizaciones', 'Tacógrafo']),
('4941', 'Transporte de mercancías por carretera', 'transport', 'Transport i Logística', ARRAY['toneladas', 'km_recorridos', 'flota'], ARRAY['Tacógrafo', 'ADR', 'Autorizaciones']),
('4942', 'Servicios de mudanzas', 'transport', 'Transport i Logística', ARRAY['mudanzas', 'facturacion', 'valoraciones'], ARRAY['Autorizaciones', 'Seguros']),
('5010', 'Transporte marítimo de pasajeros', 'transport', 'Transport i Logística', ARRAY['pasajeros', 'rutas', 'buques'], ARRAY['Marítimo', 'Seguridad', 'Medio ambiente']),
('5020', 'Transporte marítimo de mercancías', 'transport', 'Transport i Logística', ARRAY['TEUs', 'toneladas', 'rutas'], ARRAY['Marítimo', 'Aduanas', 'ISPS']),
('5110', 'Transporte aéreo de pasajeros', 'transport', 'Transport i Logística', ARRAY['pasajeros', 'rutas', 'ocupacion'], ARRAY['AESA', 'Seguridad aérea', 'Derechos pasajeros']),
('5121', 'Transporte aéreo de mercancías', 'transport', 'Transport i Logística', ARRAY['toneladas', 'rutas', 'puntualidad'], ARRAY['AESA', 'Aduanas', 'Mercancías peligrosas']),
('5210', 'Depósito y almacenamiento', 'transport', 'Transport i Logística', ARRAY['m2_almacen', 'ocupacion', 'clientes'], ARRAY['APQ', 'Autorizaciones', 'PRL']),
('5221', 'Actividades anexas al transporte terrestre', 'transport', 'Transport i Logística', ARRAY['servicios', 'clientes', 'instalaciones'], ARRAY['Autorizaciones', 'Seguridad']),
('5222', 'Actividades anexas al transporte marítimo', 'transport', 'Transport i Logística', ARRAY['escalas', 'servicios', 'puertos'], ARRAY['Portuario', 'Aduanas']),
('5223', 'Actividades anexas al transporte aéreo', 'transport', 'Transport i Logística', ARRAY['vuelos_atendidos', 'servicios', 'aeropuertos'], ARRAY['AESA', 'Handling']),
('5224', 'Manipulación de mercancías', 'transport', 'Transport i Logística', ARRAY['toneladas', 'contenedores', 'productividad'], ARRAY['PRL', 'Estiba']),
('5229', 'Otras actividades de transporte', 'transport', 'Transport i Logística', ARRAY['servicios', 'clientes', 'especializacion'], ARRAY['Autorizaciones']),
('5310', 'Actividades postales', 'transport', 'Transport i Logística', ARRAY['envios', 'oficinas', 'entregas'], ARRAY['Postal', 'LOPD']),
('5320', 'Otras actividades postales y de correos', 'transport', 'Transport i Logística', ARRAY['envios', 'tiempo_entrega', 'cobertura'], ARRAY['Postal', 'E-commerce']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- HOSTELERÍA (55-56) - Pilar del turismo español
-- ═══════════════════════════════════════════════════════════════════════════════
('5510', 'Hoteles y alojamientos similares', 'hospitality', 'Hostaleria', ARRAY['ocupacion', 'ADR', 'RevPAR', 'estrellas'], ARRAY['Turismo', 'Sanidad', 'Accesibilidad']),
('5520', 'Alojamientos turísticos', 'hospitality', 'Hostaleria', ARRAY['ocupacion', 'reservas', 'valoracion'], ARRAY['Turismo', 'Viviendas turísticas']),
('5530', 'Campings y aparcamientos caravanas', 'hospitality', 'Hostaleria', ARRAY['parcelas', 'ocupacion', 'servicios'], ARRAY['Camping', 'Turismo', 'Medio ambiente']),
('5590', 'Otros alojamientos', 'hospitality', 'Hostaleria', ARRAY['camas', 'ocupacion', 'servicios'], ARRAY['Turismo', 'Sanidad']),
('5610', 'Restaurantes y puestos de comidas', 'hospitality', 'Hostaleria', ARRAY['cubiertos', 'ticket_medio', 'rotacion'], ARRAY['Sanidad', 'HACCP', 'Licencias']),
('5621', 'Provisión de comidas preparadas para eventos', 'hospitality', 'Hostaleria', ARRAY['eventos', 'comensales', 'facturacion'], ARRAY['HACCP', 'Alérgenos', 'Licencias']),
('5629', 'Otros servicios de comidas', 'hospitality', 'Hostaleria', ARRAY['raciones', 'clientes', 'ubicaciones'], ARRAY['Sanidad', 'HACCP']),
('5630', 'Establecimientos de bebidas', 'hospitality', 'Hostaleria', ARRAY['consumiciones', 'ticket_medio', 'aforo'], ARRAY['Licencias', 'Horarios', 'Ruido']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- INFORMACIÓN Y COMUNICACIONES (58-63) - Sector digital creciente
-- ═══════════════════════════════════════════════════════════════════════════════
('5811', 'Edición de libros', 'media', 'Informació i Comunicacions', ARRAY['titulos', 'ejemplares', 'digital'], ARRAY['Propiedad intelectual', 'ISBN']),
('5813', 'Edición de periódicos', 'media', 'Informació i Comunicacions', ARRAY['tirada', 'suscriptores', 'digital'], ARRAY['Prensa', 'Publicidad']),
('5814', 'Edición de revistas', 'media', 'Informació i Comunicacions', ARRAY['tirada', 'anunciantes', 'digital'], ARRAY['Prensa', 'OJD']),
('5821', 'Edición de videojuegos', 'media', 'Informació i Comunicacions', ARRAY['titulos', 'descargas', 'ingresos'], ARRAY['PEGI', 'Propiedad intelectual']),
('5829', 'Edición de otros programas informáticos', 'media', 'Informació i Comunicacions', ARRAY['licencias', 'SaaS', 'clientes'], ARRAY['Software', 'LOPD']),
('5911', 'Producción cinematográfica y de vídeo', 'media', 'Informació i Comunicacions', ARRAY['producciones', 'espectadores', 'premios'], ARRAY['ICAA', 'Propiedad intelectual']),
('5912', 'Postproducción cinematográfica', 'media', 'Informació i Comunicacions', ARRAY['proyectos', 'clientes', 'tecnologia'], ARRAY['ICAA']),
('5913', 'Distribución cinematográfica', 'media', 'Informació i Comunicacions', ARRAY['peliculas', 'salas', 'recaudacion'], ARRAY['ICAA', 'Cuotas pantalla']),
('5914', 'Exhibición cinematográfica', 'media', 'Informació i Comunicacions', ARRAY['espectadores', 'salas', 'recaudacion'], ARRAY['ICAA', 'Accesibilidad']),
('5920', 'Actividades de grabación de sonido', 'media', 'Informació i Comunicacions', ARRAY['producciones', 'artistas', 'streaming'], ARRAY['Propiedad intelectual', 'SGAE']),
('6010', 'Actividades de radiodifusión', 'media', 'Informació i Comunicacions', ARRAY['audiencia', 'programacion', 'publicidad'], ARRAY['Audiovisual', 'Licencias']),
('6020', 'Actividades de programación televisiva', 'media', 'Informació i Comunicacions', ARRAY['audiencia', 'share', 'publicidad'], ARRAY['Audiovisual', 'CNMC']),
('6110', 'Telecomunicaciones por cable', 'telecom', 'Telecomunicacions', ARRAY['abonados', 'ARPU', 'cobertura'], ARRAY['Telecom', 'CNMC', 'Consumidores']),
('6120', 'Telecomunicaciones inalámbricas', 'telecom', 'Telecomunicacions', ARRAY['lineas', 'cobertura', 'ARPU'], ARRAY['Espectro', 'CNMC', 'Roaming']),
('6130', 'Telecomunicaciones por satélite', 'telecom', 'Telecomunicacions', ARRAY['capacidad', 'clientes', 'cobertura'], ARRAY['Espacio', 'Telecom']),
('6190', 'Otras actividades de telecomunicaciones', 'telecom', 'Telecomunicacions', ARRAY['servicios', 'clientes', 'infraestructura'], ARRAY['Telecom', 'CNMC']),
('6201', 'Programación informática', 'technology', 'Tecnologia', ARRAY['proyectos', 'desarrolladores', 'tecnologias'], ARRAY['LOPD', 'Propiedad intelectual']),
('6202', 'Consultoría informática', 'technology', 'Tecnologia', ARRAY['proyectos', 'consultores', 'clientes'], ARRAY['LOPD', 'ISO 27001']),
('6203', 'Gestión de recursos informáticos', 'technology', 'Tecnologia', ARRAY['servidores', 'SLA', 'clientes'], ARRAY['LOPD', 'ISO 27001', 'ENS']),
('6209', 'Otros servicios de tecnología', 'technology', 'Tecnologia', ARRAY['servicios', 'clientes', 'especializacion'], ARRAY['LOPD', 'Ciberseguridad']),
('6311', 'Proceso de datos y hosting', 'technology', 'Tecnologia', ARRAY['clientes', 'uptime', 'capacidad'], ARRAY['LOPD', 'ISO 27001', 'Tier']),
('6312', 'Portales web', 'technology', 'Tecnologia', ARRAY['usuarios', 'pageviews', 'ingresos'], ARRAY['LSSI', 'LOPD', 'Cookies']),
('6391', 'Actividades de agencias de noticias', 'media', 'Informació i Comunicacions', ARRAY['noticias_dia', 'suscriptores', 'cobertura'], ARRAY['Prensa', 'Deontología']),
('6399', 'Otros servicios de información', 'media', 'Informació i Comunicacions', ARRAY['consultas', 'bases_datos', 'clientes'], ARRAY['LOPD', 'Propiedad intelectual']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- ACTIVIDADES FINANCIERAS Y SEGUROS (64-66) - Nuestro sector objetivo
-- ═══════════════════════════════════════════════════════════════════════════════
('6411', 'Banco central', 'banking', 'Banca i Finances', ARRAY['politica_monetaria', 'supervision', 'reservas'], ARRAY['BCE', 'Banco España']),
('6419', 'Otra intermediación monetaria', 'banking', 'Banca i Finances', ARRAY['activos', 'depositos', 'creditos', 'ROE'], ARRAY['Basel III', 'MiFID II', 'PSD2']),
('6420', 'Actividades de sociedades holding', 'banking', 'Banca i Finances', ARRAY['participadas', 'dividendos', 'valor_cartera'], ARRAY['Mercantil', 'Fiscal']),
('6430', 'Inversión colectiva', 'banking', 'Banca i Finances', ARRAY['patrimonio', 'participes', 'rentabilidad'], ARRAY['CNMV', 'UCITS', 'AIFMD']),
('6491', 'Arrendamiento financiero', 'banking', 'Banca i Finances', ARRAY['contratos', 'cartera', 'morosidad'], ARRAY['Leasing', 'Banco España']),
('6492', 'Otras actividades crediticias', 'banking', 'Banca i Finances', ARRAY['cartera', 'operaciones', 'TAE'], ARRAY['Crédito consumo', 'Banco España']),
('6499', 'Otros servicios financieros', 'banking', 'Banca i Finances', ARRAY['operaciones', 'clientes', 'comisiones'], ARRAY['Banco España', 'CNMV']),
('6511', 'Seguros de vida', 'insurance', 'Assegurances', ARRAY['primas', 'siniestralidad', 'provisiones'], ARRAY['Solvencia II', 'DGSFP']),
('6512', 'Seguros distintos de vida', 'insurance', 'Assegurances', ARRAY['primas', 'siniestralidad', 'ratio_combinado'], ARRAY['Solvencia II', 'DGSFP']),
('6520', 'Reaseguro', 'insurance', 'Assegurances', ARRAY['primas_cedidas', 'retrocesion', 'capital'], ARRAY['Solvencia II', 'EIOPA']),
('6530', 'Fondos de pensiones', 'insurance', 'Assegurances', ARRAY['patrimonio', 'participes', 'rentabilidad'], ARRAY['Planes pensiones', 'DGSFP']),
('6611', 'Administración de mercados financieros', 'banking', 'Banca i Finances', ARRAY['operaciones', 'capitalizacion', 'miembros'], ARRAY['CNMV', 'MiFID II']),
('6612', 'Actividades de intermediación en valores', 'banking', 'Banca i Finances', ARRAY['operaciones', 'clientes', 'comisiones'], ARRAY['CNMV', 'MiFID II', 'EMIR']),
('6619', 'Otras actividades auxiliares financieras', 'banking', 'Banca i Finances', ARRAY['servicios', 'clientes', 'comisiones'], ARRAY['CNMV', 'Banco España']),
('6621', 'Evaluación de riesgos y daños', 'insurance', 'Assegurances', ARRAY['peritaciones', 'tiempo_respuesta', 'clientes'], ARRAY['Seguros', 'Peritaje']),
('6622', 'Actividades de agentes de seguros', 'insurance', 'Assegurances', ARRAY['primas_intermediadas', 'polizas', 'renovaciones'], ARRAY['Mediación seguros', 'DGSFP']),
('6629', 'Otras actividades auxiliares de seguros', 'insurance', 'Assegurances', ARRAY['servicios', 'clientes', 'aseguradoras'], ARRAY['DGSFP']),
('6630', 'Actividades de gestión de fondos', 'banking', 'Banca i Finances', ARRAY['patrimonio_gestionado', 'fondos', 'comisiones'], ARRAY['CNMV', 'UCITS', 'MiFID II']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- ACTIVIDADES INMOBILIARIAS (68) - Sector tradicional español
-- ═══════════════════════════════════════════════════════════════════════════════
('6810', 'Compraventa de bienes inmobiliarios', 'real_estate', 'Immobiliari', ARRAY['operaciones', 'volumen', 'margen'], ARRAY['Blanqueo', 'Urbanismo', 'Notariado']),
('6820', 'Alquiler de bienes inmobiliarios', 'real_estate', 'Immobiliari', ARRAY['inmuebles', 'ocupacion', 'rentas'], ARRAY['LAU', 'Vivienda', 'IRPF']),
('6831', 'Agentes de la propiedad inmobiliaria', 'real_estate', 'Immobiliari', ARRAY['operaciones', 'cartera', 'comisiones'], ARRAY['API', 'Blanqueo', 'Consumidores']),
('6832', 'Gestión de bienes inmobiliarios', 'real_estate', 'Immobiliari', ARRAY['inmuebles_gestionados', 'clientes', 'servicios'], ARRAY['Propiedad horizontal', 'LAU']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- ACTIVIDADES PROFESIONALES, CIENTÍFICAS Y TÉCNICAS (69-75) - Alto valor añadido
-- ═══════════════════════════════════════════════════════════════════════════════
('6910', 'Actividades jurídicas', 'professional', 'Serveis Professionals', ARRAY['asuntos', 'clientes', 'areas_practica'], ARRAY['Abogacía', 'Deontología', 'Blanqueo']),
('6920', 'Actividades de contabilidad', 'professional', 'Serveis Professionals', ARRAY['clientes', 'declaraciones', 'auditorias'], ARRAY['ICAC', 'LAC', 'Blanqueo']),
('7010', 'Actividades de sedes centrales', 'professional', 'Serveis Professionals', ARRAY['filiales', 'empleados_grupo', 'servicios_compartidos'], ARRAY['Precios transferencia', 'Consolidación']),
('7021', 'Relaciones públicas y comunicación', 'professional', 'Serveis Professionals', ARRAY['clientes', 'campanas', 'impactos'], ARRAY['Publicidad', 'Deontología']),
('7022', 'Consultoría de gestión empresarial', 'professional', 'Serveis Professionals', ARRAY['proyectos', 'consultores', 'sectores'], ARRAY['Confidencialidad']),
('7111', 'Servicios técnicos de arquitectura', 'professional', 'Serveis Professionals', ARRAY['proyectos', 'm2_disenados', 'premios'], ARRAY['LOE', 'CTE', 'Colegio']),
('7112', 'Servicios técnicos de ingeniería', 'professional', 'Serveis Professionals', ARRAY['proyectos', 'sectores', 'certificaciones'], ARRAY['CTE', 'Reglamentos', 'Colegio']),
('7120', 'Ensayos y análisis técnicos', 'professional', 'Serveis Professionals', ARRAY['ensayos', 'acreditaciones', 'clientes'], ARRAY['ENAC', 'ISO 17025']),
('7211', 'Investigación en biotecnología', 'professional', 'Serveis Professionals', ARRAY['proyectos_I+D', 'patentes', 'publicaciones'], ARRAY['Bioética', 'GMO', 'Patentes']),
('7219', 'Otra investigación científica', 'professional', 'Serveis Professionals', ARRAY['proyectos', 'publicaciones', 'financiacion'], ARRAY['I+D+i', 'Propiedad intelectual']),
('7220', 'Investigación en ciencias sociales', 'professional', 'Serveis Professionals', ARRAY['estudios', 'publicaciones', 'clientes'], ARRAY['Ética investigación', 'LOPD']),
('7311', 'Agencias de publicidad', 'professional', 'Serveis Professionals', ARRAY['campanas', 'clientes', 'premios'], ARRAY['Publicidad', 'Autocontrol']),
('7312', 'Servicios de representación medios', 'professional', 'Serveis Professionals', ARRAY['inversion_gestionada', 'clientes', 'medios'], ARRAY['Publicidad', 'Transparencia']),
('7320', 'Estudios de mercado y encuestas', 'professional', 'Serveis Professionals', ARRAY['estudios', 'entrevistas', 'clientes'], ARRAY['LOPD', 'ESOMAR']),
('7410', 'Actividades de diseño especializado', 'professional', 'Serveis Professionals', ARRAY['proyectos', 'clientes', 'premios'], ARRAY['Propiedad intelectual', 'Diseño industrial']),
('7420', 'Actividades de fotografía', 'professional', 'Serveis Professionals', ARRAY['sesiones', 'clientes', 'especializacion'], ARRAY['Propiedad intelectual', 'LOPD']),
('7430', 'Actividades de traducción', 'professional', 'Serveis Professionals', ARRAY['palabras', 'idiomas', 'clientes'], ARRAY['Jurados', 'Calidad']),
('7490', 'Otras actividades profesionales', 'professional', 'Serveis Professionals', ARRAY['servicios', 'clientes', 'especializacion'], ARRAY['Varias normativas']),
('7500', 'Actividades veterinarias', 'professional', 'Serveis Professionals', ARRAY['consultas', 'clientes', 'animales'], ARRAY['Veterinaria', 'Medicamentos veterinarios']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- ACTIVIDADES ADMINISTRATIVAS Y SERVICIOS AUXILIARES (77-82) - Servicios empresariales
-- ═══════════════════════════════════════════════════════════════════════════════
('7711', 'Alquiler de automóviles', 'services', 'Serveis Administratius', ARRAY['vehiculos', 'dias_alquiler', 'ocupacion'], ARRAY['Alquiler vehículos', 'Seguros']),
('7712', 'Alquiler de camiones', 'services', 'Serveis Administratius', ARRAY['vehiculos', 'contratos', 'km_recorridos'], ARRAY['Transporte', 'Seguros']),
('7721', 'Alquiler de artículos de ocio', 'services', 'Serveis Administratius', ARRAY['articulos', 'alquileres', 'rotacion'], ARRAY['Consumidores', 'Seguros']),
('7722', 'Alquiler de cintas de vídeo', 'services', 'Serveis Administratius', ARRAY['titulos', 'alquileres', 'suscriptores'], ARRAY['Propiedad intelectual']),
('7729', 'Alquiler de otros efectos personales', 'services', 'Serveis Administratius', ARRAY['articulos', 'alquileres', 'clientes'], ARRAY['Consumidores']),
('7731', 'Alquiler de maquinaria agrícola', 'services', 'Serveis Administratius', ARRAY['equipos', 'dias_alquiler', 'clientes'], ARRAY['Maquinaria', 'Seguros']),
('7732', 'Alquiler de maquinaria construcción', 'services', 'Serveis Administratius', ARRAY['equipos', 'dias_alquiler', 'proyectos'], ARRAY['PRL', 'Seguros']),
('7733', 'Alquiler de maquinaria oficina', 'services', 'Serveis Administratius', ARRAY['equipos', 'contratos', 'servicio'], ARRAY['RAEE', 'Leasing']),
('7734', 'Alquiler de medios de navegación', 'services', 'Serveis Administratius', ARRAY['embarcaciones', 'dias_alquiler', 'puertos'], ARRAY['Náutico', 'Seguros']),
('7735', 'Alquiler de medios de transporte aéreo', 'services', 'Serveis Administratius', ARRAY['aeronaves', 'horas_vuelo', 'contratos'], ARRAY['AESA', 'Seguros']),
('7739', 'Alquiler de otra maquinaria', 'services', 'Serveis Administratius', ARRAY['equipos', 'contratos', 'sectores'], ARRAY['Seguros', 'Mantenimiento']),
('7740', 'Arrendamiento propiedad intelectual', 'services', 'Serveis Administratius', ARRAY['licencias', 'royalties', 'patentes'], ARRAY['Propiedad intelectual', 'Patentes']),
('7810', 'Actividades de agencias de colocación', 'services', 'Serveis Administratius', ARRAY['colocaciones', 'ofertas', 'clientes'], ARRAY['Empleo', 'LOPD']),
('7820', 'Actividades de ETT', 'services', 'Serveis Administratius', ARRAY['trabajadores_cedidos', 'horas', 'clientes'], ARRAY['ETT', 'Laboral', 'PRL']),
('7830', 'Otra provisión de recursos humanos', 'services', 'Serveis Administratius', ARRAY['profesionales', 'proyectos', 'clientes'], ARRAY['Laboral', 'LOPD']),
('7911', 'Actividades de agencias de viajes', 'services', 'Serveis Administratius', ARRAY['viajes_vendidos', 'facturacion', 'clientes'], ARRAY['Turismo', 'Consumidores', 'IATA']),
('7912', 'Actividades de operadores turísticos', 'services', 'Serveis Administratius', ARRAY['paquetes', 'pax', 'destinos'], ARRAY['Turismo', 'Paquetes turísticos']),
('7990', 'Otros servicios de reservas', 'services', 'Serveis Administratius', ARRAY['reservas', 'clientes', 'comisiones'], ARRAY['Turismo', 'Consumidores']),
('8010', 'Actividades de seguridad privada', 'services', 'Serveis Administratius', ARRAY['vigilantes', 'clientes', 'instalaciones'], ARRAY['Seguridad privada', 'Interior']),
('8020', 'Servicios de sistemas de seguridad', 'services', 'Serveis Administratius', ARRAY['instalaciones', 'abonados', 'centrales'], ARRAY['Seguridad privada', 'LOPD']),
('8030', 'Actividades de investigación', 'services', 'Serveis Administratius', ARRAY['casos', 'informes', 'clientes'], ARRAY['Detectives', 'LOPD']),
('8110', 'Servicios integrales a edificios', 'services', 'Serveis Administratius', ARRAY['edificios', 'm2_gestionados', 'servicios'], ARRAY['Facility management', 'PRL']),
('8121', 'Limpieza general de edificios', 'services', 'Serveis Administratius', ARRAY['clientes', 'm2_limpiados', 'empleados'], ARRAY['PRL', 'Convenio limpieza']),
('8122', 'Otras actividades de limpieza', 'services', 'Serveis Administratius', ARRAY['servicios', 'clientes', 'especializacion'], ARRAY['PRL', 'Medio ambiente']),
('8129', 'Otras actividades de limpieza', 'services', 'Serveis Administratius', ARRAY['servicios', 'clientes', 'frecuencia'], ARRAY['PRL']),
('8130', 'Actividades de jardinería', 'services', 'Serveis Administratius', ARRAY['contratos', 'm2_mantenidos', 'clientes'], ARRAY['Fitosanitarios', 'Riego']),
('8211', 'Servicios administrativos combinados', 'services', 'Serveis Administratius', ARRAY['clientes', 'servicios', 'empleados'], ARRAY['LOPD', 'Subcontratación']),
('8219', 'Actividades de fotocopiado y otras', 'services', 'Serveis Administratius', ARRAY['servicios', 'clientes', 'volumen'], ARRAY['LOPD', 'Propiedad intelectual']),
('8220', 'Actividades de centros de llamadas', 'services', 'Serveis Administratius', ARRAY['llamadas', 'agentes', 'clientes'], ARRAY['LOPD', 'Telemarketing', 'Consumidores']),
('8230', 'Organización de convenciones', 'services', 'Serveis Administratius', ARRAY['eventos', 'asistentes', 'facturacion'], ARRAY['Eventos', 'PRL', 'Licencias']),
('8291', 'Actividades de cobro y evaluación crediticia', 'services', 'Serveis Administratius', ARRAY['expedientes', 'recuperacion', 'clientes'], ARRAY['LOPD', 'Consumidores', 'Blanqueo']),
('8292', 'Actividades de envasado', 'services', 'Serveis Administratius', ARRAY['unidades', 'clientes', 'tipos'], ARRAY['Envases', 'Seguridad alimentaria']),
('8299', 'Otras actividades de apoyo empresas', 'services', 'Serveis Administratius', ARRAY['servicios', 'clientes', 'especializacion'], ARRAY['Varias normativas']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- EDUCACIÓN (85) - Sector social clave
-- ═══════════════════════════════════════════════════════════════════════════════
('8510', 'Educación preprimaria', 'education', 'Educació', ARRAY['alumnos', 'aulas', 'ratio'], ARRAY['Educación', 'Menores', 'Sanidad']),
('8520', 'Educación primaria', 'education', 'Educació', ARRAY['alumnos', 'profesores', 'ratio'], ARRAY['LOE/LOMLOE', 'Conciertos']),
('8531', 'Educación secundaria general', 'education', 'Educació', ARRAY['alumnos', 'profesores', 'resultados'], ARRAY['LOE/LOMLOE', 'Selectividad']),
('8532', 'Educación secundaria técnica', 'education', 'Educació', ARRAY['alumnos', 'ciclos', 'insercion'], ARRAY['FP', 'Cualificaciones']),
('8541', 'Educación postsecundaria no terciaria', 'education', 'Educació', ARRAY['alumnos', 'programas', 'certificaciones'], ARRAY['Cualificaciones profesionales']),
('8542', 'Educación terciaria', 'education', 'Educació', ARRAY['estudiantes', 'titulaciones', 'investigacion'], ARRAY['Universidad', 'ANECA']),
('8551', 'Educación deportiva y recreativa', 'education', 'Educació', ARRAY['alumnos', 'actividades', 'instalaciones'], ARRAY['Deporte', 'Menores']),
('8552', 'Educación cultural', 'education', 'Educació', ARRAY['alumnos', 'disciplinas', 'profesores'], ARRAY['Educación', 'Cultura']),
('8553', 'Escuelas de conducción', 'education', 'Educació', ARRAY['alumnos', 'permisos', 'aprobados'], ARRAY['DGT', 'Autoescuelas']),
('8559', 'Otra educación', 'education', 'Educació', ARRAY['alumnos', 'cursos', 'certificaciones'], ARRAY['Formación', 'Acreditaciones']),
('8560', 'Actividades auxiliares a la educación', 'education', 'Educació', ARRAY['servicios', 'centros', 'alumnos'], ARRAY['Educación', 'LOPD']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- SANIDAD Y SERVICIOS SOCIALES (86-88) - Sector esencial
-- ═══════════════════════════════════════════════════════════════════════════════
('8610', 'Actividades hospitalarias', 'healthcare', 'Sanitat', ARRAY['camas', 'ingresos', 'consultas'], ARRAY['Sanidad', 'Acreditación', 'LOPD']),
('8621', 'Actividades de medicina general', 'healthcare', 'Sanitat', ARRAY['pacientes', 'consultas', 'derivaciones'], ARRAY['Sanidad', 'Colegio médicos', 'LOPD']),
('8622', 'Actividades de medicina especializada', 'healthcare', 'Sanitat', ARRAY['pacientes', 'procedimientos', 'especialidades'], ARRAY['Sanidad', 'Autorización', 'LOPD']),
('8623', 'Actividades odontológicas', 'healthcare', 'Sanitat', ARRAY['pacientes', 'tratamientos', 'implantes'], ARRAY['Sanidad', 'Colegio dentistas']),
('8690', 'Otras actividades sanitarias', 'healthcare', 'Sanitat', ARRAY['pacientes', 'servicios', 'profesionales'], ARRAY['Sanidad', 'Colegios profesionales']),
('8710', 'Asistencia en establecimientos residenciales', 'healthcare', 'Sanitat', ARRAY['plazas', 'ocupacion', 'personal'], ARRAY['Dependencia', 'Sanidad', 'Acreditación']),
('8720', 'Asistencia residencial para discapacitados', 'healthcare', 'Sanitat', ARRAY['plazas', 'usuarios', 'servicios'], ARRAY['Dependencia', 'Discapacidad']),
('8730', 'Asistencia residencial para mayores', 'healthcare', 'Sanitat', ARRAY['plazas', 'ocupacion', 'ratio_personal'], ARRAY['Dependencia', 'Residencias']),
('8790', 'Otras actividades de asistencia residencial', 'healthcare', 'Sanitat', ARRAY['plazas', 'usuarios', 'servicios'], ARRAY['Servicios sociales', 'Acreditación']),
('8810', 'Actividades de servicios sociales sin alojamiento para mayores', 'healthcare', 'Sanitat', ARRAY['usuarios', 'servicios', 'horas'], ARRAY['Dependencia', 'SAD']),
('8891', 'Actividades de cuidado diurno de niños', 'healthcare', 'Sanitat', ARRAY['ninos', 'plazas', 'horario'], ARRAY['Menores', 'Educación infantil']),
('8899', 'Otros servicios sociales sin alojamiento', 'healthcare', 'Sanitat', ARRAY['usuarios', 'programas', 'profesionales'], ARRAY['Servicios sociales']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- ACTIVIDADES ARTÍSTICAS Y DE ENTRETENIMIENTO (90-93) - Cultura y ocio
-- ═══════════════════════════════════════════════════════════════════════════════
('9001', 'Artes escénicas', 'entertainment', 'Arts i Entreteniment', ARRAY['funciones', 'espectadores', 'producciones'], ARRAY['Espectáculos', 'SGAE', 'PRL']),
('9002', 'Actividades auxiliares a las artes escénicas', 'entertainment', 'Arts i Entreteniment', ARRAY['producciones', 'servicios', 'clientes'], ARRAY['Espectáculos', 'PRL']),
('9003', 'Creación artística y literaria', 'entertainment', 'Arts i Entreteniment', ARRAY['obras', 'ingresos', 'premios'], ARRAY['Propiedad intelectual', 'IRPF artistas']),
('9004', 'Gestión de salas de espectáculos', 'entertainment', 'Arts i Entreteniment', ARRAY['eventos', 'asistentes', 'aforo'], ARRAY['Espectáculos', 'Licencias', 'PRL']),
('9102', 'Actividades de museos', 'entertainment', 'Arts i Entreteniment', ARRAY['visitantes', 'coleccion', 'exposiciones'], ARRAY['Patrimonio', 'Museos']),
('9103', 'Gestión de lugares históricos', 'entertainment', 'Arts i Entreteniment', ARRAY['visitantes', 'conservacion', 'programas'], ARRAY['Patrimonio', 'BIC']),
('9104', 'Actividades de jardines botánicos y zoológicos', 'entertainment', 'Arts i Entreteniment', ARRAY['visitantes', 'especies', 'conservacion'], ARRAY['Zoo', 'CITES', 'Bienestar animal']),
('9200', 'Actividades de juegos de azar', 'entertainment', 'Arts i Entreteniment', ARRAY['jugadores', 'ingresos', 'maquinas'], ARRAY['Juego', 'Blanqueo', 'Publicidad']),
('9311', 'Gestión de instalaciones deportivas', 'entertainment', 'Arts i Entreteniment', ARRAY['usuarios', 'abonados', 'instalaciones'], ARRAY['Deporte', 'PRL', 'Sanidad']),
('9312', 'Actividades de clubes deportivos', 'entertainment', 'Arts i Entreteniment', ARRAY['socios', 'equipos', 'competiciones'], ARRAY['Deporte', 'Federaciones']),
('9313', 'Actividades de gimnasios', 'entertainment', 'Arts i Entreteniment', ARRAY['socios', 'm2', 'clases'], ARRAY['Deporte', 'Sanidad', 'Consumidores']),
('9319', 'Otras actividades deportivas', 'entertainment', 'Arts i Entreteniment', ARRAY['participantes', 'eventos', 'disciplinas'], ARRAY['Deporte', 'Federaciones']),
('9321', 'Actividades de parques de atracciones', 'entertainment', 'Arts i Entreteniment', ARRAY['visitantes', 'atracciones', 'facturacion'], ARRAY['Parques', 'Seguridad', 'Consumidores']),
('9329', 'Otras actividades recreativas', 'entertainment', 'Arts i Entreteniment', ARRAY['usuarios', 'servicios', 'locales'], ARRAY['Ocio', 'Licencias']),

-- ═══════════════════════════════════════════════════════════════════════════════
-- OTROS SERVICIOS (94-96) - Servicios diversos
-- ═══════════════════════════════════════════════════════════════════════════════
('9411', 'Actividades de organizaciones empresariales', 'other_services', 'Altres Serveis', ARRAY['asociados', 'servicios', 'representacion'], ARRAY['Asociaciones', 'Lobbying']),
('9412', 'Actividades de organizaciones profesionales', 'other_services', 'Altres Serveis', ARRAY['colegiados', 'servicios', 'disciplinas'], ARRAY['Colegios profesionales']),
('9420', 'Actividades sindicales', 'other_services', 'Altres Serveis', ARRAY['afiliados', 'delegados', 'convenios'], ARRAY['Sindical', 'Laboral']),
('9491', 'Actividades de organizaciones religiosas', 'other_services', 'Altres Serveis', ARRAY['fieles', 'actividades', 'centros'], ARRAY['Libertad religiosa', 'Acuerdos']),
('9492', 'Actividades de organizaciones políticas', 'other_services', 'Altres Serveis', ARRAY['afiliados', 'cargos', 'financiacion'], ARRAY['Partidos políticos', 'Electoral']),
('9499', 'Otras actividades asociativas', 'other_services', 'Altres Serveis', ARRAY['socios', 'actividades', 'proyectos'], ARRAY['Asociaciones', 'Fundaciones']),
('9511', 'Reparación de ordenadores', 'other_services', 'Altres Serveis', ARRAY['reparaciones', 'clientes', 'garantias'], ARRAY['RAEE', 'Consumidores']),
('9512', 'Reparación de equipos de comunicación', 'other_services', 'Altres Serveis', ARRAY['reparaciones', 'clientes', 'marcas'], ARRAY['RAEE', 'Consumidores']),
('9521', 'Reparación de aparatos electrónicos', 'other_services', 'Altres Serveis', ARRAY['reparaciones', 'clientes', 'tipos'], ARRAY['RAEE', 'Consumidores']),
('9522', 'Reparación de electrodomésticos', 'other_services', 'Altres Serveis', ARRAY['reparaciones', 'SAT', 'marcas'], ARRAY['RAEE', 'Consumidores', 'Garantías']),
('9523', 'Reparación de calzado', 'other_services', 'Altres Serveis', ARRAY['reparaciones', 'clientes', 'servicios'], ARRAY['Consumidores']),
('9524', 'Reparación de muebles', 'other_services', 'Altres Serveis', ARRAY['reparaciones', 'clientes', 'tipos'], ARRAY['Consumidores']),
('9525', 'Reparación de relojes y joyería', 'other_services', 'Altres Serveis', ARRAY['reparaciones', 'clientes', 'certificaciones'], ARRAY['Metales preciosos', 'Consumidores']),
('9529', 'Reparación de otros efectos personales', 'other_services', 'Altres Serveis', ARRAY['reparaciones', 'clientes', 'tipos'], ARRAY['Consumidores']),
('9601', 'Lavado y limpieza de prendas', 'other_services', 'Altres Serveis', ARRAY['kg_lavados', 'clientes', 'servicios'], ARRAY['Etiquetado', 'Medio ambiente']),
('9602', 'Peluquería y otros tratamientos de belleza', 'other_services', 'Altres Serveis', ARRAY['clientes', 'servicios', 'ticket_medio'], ARRAY['Sanidad', 'Cosméticos', 'Consumidores']),
('9603', 'Pompas fúnebres', 'other_services', 'Altres Serveis', ARRAY['servicios', 'cementerios', 'cremaciones'], ARRAY['Funerarias', 'Sanidad']),
('9604', 'Actividades de mantenimiento físico', 'other_services', 'Altres Serveis', ARRAY['clientes', 'sesiones', 'servicios'], ARRAY['Sanidad', 'Deporte']),
('9609', 'Otros servicios personales', 'other_services', 'Altres Serveis', ARRAY['clientes', 'servicios', 'especializacion'], ARRAY['Consumidores'])

ON CONFLICT (cnae_code) DO UPDATE SET
  cnae_description = EXCLUDED.cnae_description,
  sector = EXCLUDED.sector,
  sector_name = EXCLUDED.sector_name,
  default_kpis = EXCLUDED.default_kpis,
  default_regulations = EXCLUDED.default_regulations;
