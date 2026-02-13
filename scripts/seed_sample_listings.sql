-- Seed sample listings with real Nha Trang addresses and coordinates.
-- Run AFTER migration 006 and after creating at least one agent.
-- Usage: docker exec -i <container> psql -U re_nhatrang -d re_nhatrang < scripts/seed_sample_listings.sql

-- Ensure agent_id=1 exists (the script create_agent.sh creates the first agent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM agents WHERE id = 1) THEN
    RAISE EXCEPTION 'Agent with id=1 does not exist. Create an agent first via scripts/create_agent.sh';
  END IF;
END $$;

INSERT INTO parsed_listings (
  agent_id, property_type, transaction_type, price_raw, price_vnd,
  area_m2, address_raw, ward, street, district,
  num_bedrooms, num_bathrooms, num_floors, frontage_m, depth_m,
  access_road, furnished, legal_status, structure_type, building_type,
  direction, latitude, longitude, status, description
) VALUES
-- 1. Beachfront villa on Tran Phu
(1, 'biet_thu', 'ban', '25 ty', 25000000000,
 350, '78 Tran Phu', 'Loc Tho', 'Tran Phu', 'Nha Trang',
 5, 4, 3, 12.0, 30.0,
 'mat_duong', 'full', 'so_hong', 'me_duc', 'xay_moi',
 'dong', 12.2445, 109.1940, 'for_sale',
 'Luxury beachfront villa with panoramic ocean views. Modern design, private garden, rooftop terrace. Walking distance to the beach and city center.'),

-- 2. Apartment near Tran Phu beach
(1, 'can_ho', 'ban', '3.2 ty', 3200000000,
 85, 'Muong Thanh Vien Trieu, 60 Tran Phu', 'Loc Tho', 'Tran Phu', 'Nha Trang',
 2, 2, NULL, NULL, NULL,
 NULL, 'full', 'so_hong', NULL, 'xay_moi',
 'dong', 12.2460, 109.1935, 'for_sale',
 'High-floor apartment with sea view in Muong Thanh complex. Fully furnished, modern kitchen, pool and gym access.'),

-- 3. House in Phuoc Hai on Nguyen Thien Thuat
(1, 'nha', 'ban', '4.5 ty', 4500000000,
 72, '15 Nguyen Thien Thuat', 'Phuoc Hai', 'Nguyen Thien Thuat', 'Nha Trang',
 3, 2, 3, 4.5, 16.0,
 'mat_duong', 'co_ban', 'so_hong', 'me_duc', 'kien_co',
 'tay', 12.2410, 109.1920, 'for_sale',
 'Solid 3-story house on busy commercial street. Ground floor suitable for shop or restaurant. Near Cho Dam market.'),

-- 4. Land plot in Vinh Hoa
(1, 'dat', 'ban', '1.8 ty', 1800000000,
 100, 'Hem 68 Le Hong Phong', 'Vinh Hoa', 'Le Hong Phong', 'Nha Trang',
 NULL, NULL, NULL, 5.0, 20.0,
 'hem_oto', NULL, 'tho_cu', NULL, NULL,
 'nam', 12.2590, 109.1870, 'for_sale',
 'Residential land plot in developing area. Car-accessible alley, quiet neighborhood near schools. Full residential zoning.'),

-- 5. Commercial space on Yersin
(1, 'mat_bang', 'ban', '8 ty', 8000000000,
 120, '25 Yersin', 'Phuong Sai', 'Yersin', 'Nha Trang',
 NULL, NULL, 2, 6.0, 20.0,
 'mat_duong', 'khong', 'so_hong', 'me_duc', 'kien_co',
 'bac', 12.2395, 109.1885, 'for_sale',
 'Prime commercial space on Yersin street. High foot traffic, near the train station. Suitable for retail, restaurant, or office.'),

-- 6. House in Vinh Hai
(1, 'nha', 'ban', '2.8 ty', 2800000000,
 65, '10/5 Pham Van Dong', 'Vinh Hai', 'Pham Van Dong', 'Nha Trang',
 3, 2, 2, 4.0, 16.0,
 'hem_oto', 'co_ban', 'so_hong', 'me_duc', 'moi_sua',
 'dong_nam', 12.2680, 109.1890, 'for_sale',
 'Recently renovated 2-story house near the beach. Car alley, quiet area. Close to Hon Chong and the bay.'),

-- 7. Apartment in Tan Tien (city center)
(1, 'can_ho', 'ban', '1.9 ty', 1900000000,
 68, 'CT2 VCN Phuoc Hai, Cao Ba Quat', 'Tan Tien', 'Cao Ba Quat', 'Nha Trang',
 2, 1, NULL, NULL, NULL,
 NULL, 'co_ban', 'so_hong', NULL, 'xay_moi',
 'tay_nam', 12.2350, 109.1850, 'for_sale',
 'Affordable apartment in VCN complex. Basic furnishing, balcony with city view. Near schools and supermarkets.'),

-- 8. Villa in Vinh Ngoc (north side)
(1, 'biet_thu', 'ban', '12 ty', 12000000000,
 250, '45 Nguyen Tat Thanh, Vinh Ngoc', 'Vinh Ngoc', 'Nguyen Tat Thanh', 'Nha Trang',
 4, 3, 2, 10.0, 25.0,
 'mat_duong', 'full', 'so_hong', 'me_duc', 'xay_moi',
 'dong', 12.2800, 109.2000, 'for_sale',
 'Modern villa with garden and private pool. Ocean proximity, mountain views. Perfect for family or boutique hospitality.'),

-- 9. Land in Phuoc Dong (developing area)
(1, 'dat', 'ban', '850 trieu', 850000000,
 80, 'Hamlet 3, Phuoc Dong', 'Phuoc Dong', NULL, 'Nha Trang',
 NULL, NULL, NULL, 4.0, 20.0,
 'hem_rong', NULL, 'tho_cu', NULL, NULL,
 'bac', 12.2100, 109.1750, 'for_sale',
 'Affordable land in Phuoc Dong commune. Wide alley access, growing residential area. Good investment opportunity.'),

-- 10. House on Hung Vuong, Phuong Son
(1, 'nha', 'ban', '6.5 ty', 6500000000,
 95, '112 Hung Vuong', 'Phuong Son', 'Hung Vuong', 'Nha Trang',
 4, 3, 4, 5.0, 19.0,
 'mat_duong', 'full', 'so_hong', 'me_duc', 'kien_co',
 'dong', 12.2365, 109.1895, 'for_sale',
 '4-story house on Hung Vuong boulevard. Fully furnished, road-facing, near Cho Dam market and Nha Trang Cathedral.'),

-- 11. Studio apartment, Vinh Phuoc
(1, 'can_ho', 'ban', '1.2 ty', 1200000000,
 45, 'Gold Coast, 1 Tran Hung Dao', 'Vinh Phuoc', 'Tran Hung Dao', 'Nha Trang',
 1, 1, NULL, NULL, NULL,
 NULL, 'full', 'so_hong', NULL, 'xay_moi',
 'dong', 12.2540, 109.1950, 'for_sale',
 'Studio in Gold Coast tower with ocean view. Fully furnished, hotel management available. Excellent rental potential.'),

-- 12. House with alley in Ngoc Hiep
(1, 'nha', 'ban', '2.2 ty', 2200000000,
 55, '25/12 Thai Nguyen', 'Ngoc Hiep', 'Thai Nguyen', 'Nha Trang',
 2, 1, 2, 3.5, 16.0,
 'hem_nho', 'khong', 'so_hong', 'me_duc', 'nha_cu',
 'tay', 12.2480, 109.1830, 'for_sale',
 'Compact 2-story house in narrow alley. Needs renovation but solid structure. Quiet residential neighborhood near Ngoc Hiep market.'),

-- 13. Land on 2 Thang 4, Vinh Phuoc
(1, 'dat', 'ban', '5 ty', 5000000000,
 150, '2 Thang 4', 'Vinh Phuoc', '2 Thang 4', 'Nha Trang',
 NULL, NULL, NULL, 7.5, 20.0,
 'mat_duong', NULL, 'so_do', NULL, NULL,
 'nam', 12.2550, 109.1910, 'for_sale',
 'Road-facing land on 2 Thang 4 street. Great visibility, zoned for mixed use. Ideal for small apartment building or commercial.'),

-- 14. House in Xuong Huan (downtown)
(1, 'nha', 'ban', '7.8 ty', 7800000000,
 88, '5 Pasteur', 'Xuong Huan', 'Pasteur', 'Nha Trang',
 3, 2, 3, 5.5, 16.0,
 'mat_duong', 'full', 'so_hong', 'me_duc', 'moi_sua',
 'dong_bac', 12.2420, 109.1945, 'for_sale',
 'Prime downtown location on Pasteur street. Recently renovated, near Sailing Club beach. Walking distance to restaurants and nightlife.');
