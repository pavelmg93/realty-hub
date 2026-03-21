-- Seed reference data for Nha Trang location tables.
-- Run after init_db.sql. Idempotent via ON CONFLICT DO NOTHING.

-- ---------------------------------------------------------------------------
-- Nha Trang Wards (phường) and Communes (xã)
-- Pre-Nov 2024: 19 phường + 8 xã = 27 units
-- Post-Nov 2024 mergers:
--   Phương Sơn + Phương Sài → Phương Sài
--   Xương Huân + Vạn Thạnh + Vạn Thắng → Vạn Thạnh
--   Phước Tiến + Phước Tân + Tân Lập → Tân Tiến
-- We store ALL names (pre- and post-merger) since listings may reference either.
-- ---------------------------------------------------------------------------

INSERT INTO nha_trang_wards (name, name_ascii, ward_type) VALUES
    -- Current wards (phường) post-merger
    ('Vĩnh Hòa',    'Vinh Hoa',     'phuong'),
    ('Vĩnh Hải',    'Vinh Hai',     'phuong'),
    ('Vĩnh Phước',  'Vinh Phuoc',   'phuong'),
    ('Vĩnh Thọ',    'Vinh Tho',     'phuong'),
    ('Vạn Thạnh',   'Van Thanh',    'phuong'),
    ('Phương Sài',  'Phuong Sai',   'phuong'),
    ('Ngọc Hiệp',  'Ngoc Hiep',    'phuong'),
    ('Phước Hòa',   'Phuoc Hoa',    'phuong'),
    ('Tân Tiến',    'Tan Tien',     'phuong'),
    ('Phước Hải',   'Phuoc Hai',    'phuong'),
    ('Lộc Thọ',     'Loc Tho',      'phuong'),
    ('Vĩnh Nguyên', 'Vinh Nguyen',  'phuong'),
    ('Vĩnh Trường', 'Vinh Truong',  'phuong'),
    ('Phước Long',  'Phuoc Long',   'phuong'),
    -- Pre-merger wards (kept for historical listing lookups)
    ('Phương Sơn',  'Phuong Son',   'phuong'),
    ('Xương Huân',  'Xuong Huan',   'phuong'),
    ('Vạn Thắng',   'Van Thang',    'phuong'),
    ('Phước Tiến',  'Phuoc Tien',   'phuong'),
    ('Phước Tân',   'Phuoc Tan',    'phuong'),
    ('Tân Lập',     'Tan Lap',      'phuong'),
    -- Communes (xã)
    ('Vĩnh Lương',  'Vinh Luong',   'xa'),
    ('Vĩnh Phương', 'Vinh Phuong',  'xa'),
    ('Vĩnh Ngọc',   'Vinh Ngoc',    'xa'),
    ('Vĩnh Thạnh',  'Vinh Thanh',   'xa'),
    ('Vĩnh Trung',  'Vinh Trung',   'xa'),
    ('Vĩnh Hiệp',   'Vinh Hiep',    'xa'),
    ('Vĩnh Thái',   'Vinh Thai',    'xa'),
    ('Phước Đồng',  'Phuoc Dong',   'xa')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Nha Trang Streets
-- Major streets + streets found in listing data
-- ---------------------------------------------------------------------------

INSERT INTO nha_trang_streets (name, name_ascii) VALUES
    -- Main coastal/central streets
    ('Trần Phú',           'Tran Phu'),
    ('Phạm Văn Đồng',     'Pham Van Dong'),
    ('Lê Hồng Phong',     'Le Hong Phong'),
    ('Nguyễn Thiện Thuật', 'Nguyen Thien Thuat'),
    ('Yersin',             'Yersin'),
    ('Hùng Vương',         'Hung Vuong'),
    ('Quang Trung',        'Quang Trung'),
    ('Thái Nguyên',        'Thai Nguyen'),
    ('Lê Thánh Tôn',      'Le Thanh Ton'),
    ('Pasteur',            'Pasteur'),
    ('Hai Bà Trưng',      'Hai Ba Trung'),
    ('Bà Triệu',          'Ba Trieu'),
    ('Trần Hưng Đạo',     'Tran Hung Dao'),
    ('Lê Lợi',            'Le Loi'),
    ('Phan Bội Châu',     'Phan Boi Chau'),
    ('Phan Chu Trinh',    'Phan Chu Trinh'),
    ('Lý Tự Trọng',      'Ly Tu Trong'),
    ('Ngô Sĩ Liên',      'Ngo Si Lien'),
    ('Nguyễn Gia Thiều',  'Nguyen Gia Thieu'),
    ('Lê Thành Phương',   'Le Thanh Phuong'),
    ('Tô Vĩnh Diện',     'To Vinh Dien'),
    ('Yết Kiêu',          'Yet Kieu'),
    ('Trần Văn Ơn',       'Tran Van On'),
    ('2 Tháng 4',         '2 Thang 4'),
    ('23 Tháng 10',       '23 Thang 10'),
    ('Hoàng Hoa Thám',    'Hoang Hoa Tham'),
    ('Hoàng Văn Thụ',     'Hoang Van Thu'),
    ('Nguyễn Trãi',       'Nguyen Trai'),
    ('Nguyễn Đình Chiểu', 'Nguyen Dinh Chieu'),
    ('Nguyễn Chánh',      'Nguyen Chanh'),
    ('Nguyễn Trung Trực', 'Nguyen Trung Truc'),
    ('Nguyễn Thị Minh Khai', 'Nguyen Thi Minh Khai'),
    ('Võ Thị Sáu',        'Vo Thi Sau'),
    ('Lý Thường Kiệt',    'Ly Thuong Kiet'),
    ('Biệt Thự',          'Biet Thu'),
    ('Tháp Bà',           'Thap Ba'),
    ('Trần Quang Khải',   'Tran Quang Khai'),
    ('Sinh Trung',         'Sinh Trung'),
    ('Tôn Đản',            'Ton Dan'),
    -- Streets found in listing data
    ('Củ Chi',             'Cu Chi'),
    ('Đồng Nai',          'Dong Nai'),
    ('Hương Điền',         'Huong Dien'),
    ('Phong Châu',         'Phong Chau'),
    ('Bùi Thiện Ngộ',     'Bui Thien Ngo'),
    ('Trần Thị Tính',     'Tran Thi Tinh'),
    ('Lương Thế Vinh',    'Luong The Vinh'),
    ('Dã Tượng',          'Da Tuong'),
    ('Nguyễn Khanh',      'Nguyen Khanh'),
    ('Trần Quý Cáp',      'Tran Quy Cap'),
    ('Cửu Long',          'Cuu Long'),
    ('Bửu Đóa',           'Buu Doa'),
    ('Phước Long',         'Phuoc Long'),
    ('D30',                'D30'),
    ('Tản Đà',             'Tan Da'),
    ('Nguyễn Khuyến',     'Nguyen Khuyen'),
    ('Lê Đại Hành',       'Le Dai Hanh'),
    ('Nguyễn Bỉnh Khiêm', 'Nguyen Binh Khiem'),
    ('Phạm Ngọc Thạch',   'Pham Ngoc Thach'),
    ('Nguyễn Xiển',        'Nguyen Xien'),
    ('Lê Hồng Phong',     'Le Hong Phong')
ON CONFLICT DO NOTHING;

