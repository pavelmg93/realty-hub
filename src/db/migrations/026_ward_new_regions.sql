-- Migration 026: Convert ward_new from individual ward names to region names
-- Old: ward_new stored individual ASCII ward names (same as ward)
-- New: ward_new stores region names: Nha Trang Ward, Bac Nha Trang, Tay Nha Trang, Nam Nha Trang

-- Nha Trang Ward region
UPDATE parsed_listings SET ward_new = 'Nha Trang Ward'
WHERE ward_new IN ('Van Thanh', 'Loc Tho', 'Vinh Nguyen', 'Tan Tien', 'Phuoc Hoa',
                   'Xuong Huan', 'Van Thang', 'Phuoc Tien', 'Phuoc Tan', 'Tan Lap');

-- Bac Nha Trang region
UPDATE parsed_listings SET ward_new = 'Bac Nha Trang'
WHERE ward_new IN ('Vinh Hoa', 'Vinh Hai', 'Vinh Phuoc', 'Vinh Tho', 'Vinh Luong', 'Vinh Phuong');

-- Tay Nha Trang region
UPDATE parsed_listings SET ward_new = 'Tay Nha Trang'
WHERE ward_new IN ('Ngoc Hiep', 'Phuong Sai', 'Vinh Ngoc', 'Vinh Thanh', 'Vinh Hiep', 'Vinh Trung',
                   'Phuong Son');

-- Nam Nha Trang region
UPDATE parsed_listings SET ward_new = 'Nam Nha Trang'
WHERE ward_new IN ('Phuoc Hai', 'Phuoc Long', 'Vinh Truong', 'Vinh Thai', 'Phuoc Dong');

-- Also backfill ward_new from ward where ward_new is null but ward has a value
UPDATE parsed_listings SET ward_new = 'Nha Trang Ward'
WHERE ward_new IS NULL AND ward IN ('Van Thanh', 'Loc Tho', 'Vinh Nguyen', 'Tan Tien', 'Phuoc Hoa',
                                     'Xuong Huan', 'Van Thang', 'Phuoc Tien', 'Phuoc Tan', 'Tan Lap');

UPDATE parsed_listings SET ward_new = 'Bac Nha Trang'
WHERE ward_new IS NULL AND ward IN ('Vinh Hoa', 'Vinh Hai', 'Vinh Phuoc', 'Vinh Tho', 'Vinh Luong', 'Vinh Phuong');

UPDATE parsed_listings SET ward_new = 'Tay Nha Trang'
WHERE ward_new IS NULL AND ward IN ('Ngoc Hiep', 'Phuong Sai', 'Vinh Ngoc', 'Vinh Thanh', 'Vinh Hiep', 'Vinh Trung',
                                     'Phuong Son');

UPDATE parsed_listings SET ward_new = 'Nam Nha Trang'
WHERE ward_new IS NULL AND ward IN ('Phuoc Hai', 'Phuoc Long', 'Vinh Truong', 'Vinh Thai', 'Phuoc Dong');
