-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security TO on;

-- Create genres table
CREATE TABLE genres (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create books table
CREATE TABLE books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  description TEXT,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_name VARCHAR(255),
  genre_id UUID REFERENCES genres(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table for extended user information
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create book_downloads table for analytics
CREATE TABLE book_downloads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

-- Create book_views table for analytics
CREATE TABLE book_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

-- Create indexes for better performance
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_genre_id ON books(genre_id);
CREATE INDEX idx_books_created_at ON books(created_at DESC);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_uploaded_by ON books(uploaded_by);
CREATE INDEX idx_books_status_created_at ON books(status, created_at DESC);

CREATE INDEX idx_book_downloads_book_id ON book_downloads(book_id);
CREATE INDEX idx_book_downloads_user_id ON book_downloads(user_id);
CREATE INDEX idx_book_downloads_downloaded_at ON book_downloads(downloaded_at DESC);

CREATE INDEX idx_book_views_book_id ON book_views(book_id);
CREATE INDEX idx_book_views_user_id ON book_views(user_id);
CREATE INDEX idx_book_views_viewed_at ON book_views(viewed_at DESC);

CREATE INDEX idx_user_profiles_is_admin ON user_profiles(is_admin);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_genres_updated_at BEFORE UPDATE ON genres FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default genres
INSERT INTO genres (name, description) VALUES 
  ('Science', 'Scientific books and research materials'),
  ('History', 'Historical accounts and analysis'),
  ('Novel', 'Fictional narrative books'),
  ('Short Stories', 'Collections of short fiction'),
  ('Economics', 'Economic theory and practice'),
  ('Politics', 'Political science and governance'),
  ('Technology', 'Technology and computer science'),
  ('Fiction', 'General fiction works'),
  ('Non-Fiction', 'Factual and informational books'),
  ('Biography', 'Life stories and memoirs'),
  ('Philosophy', 'Philosophical works and theories'),
  ('Religion', 'Religious texts and studies'),
  ('Mathematics', 'Mathematical theories and applications'),
  ('Physics', 'Physical science and principles'),
  ('Chemistry', 'Chemical science and experiments'),
  ('Biology', 'Biological sciences and life forms'),
  ('Art', 'Artistic works and theory'),
  ('Music', 'Music theory and practice'),
  ('Education', 'Educational materials and textbooks'),
  ('Business', 'Business and management books'),
  ('Health', 'Health and wellness literature'),
  ('Cookbooks', 'Recipes and cooking guides'),
  ('Travel', 'Travel guides and experiences'),
  ('Sports', 'Sports and athletic training'),
  ('Children', 'Children''s literature'),
  ('Poetry', 'Poetic works and collections'),
  ('Drama', 'Plays and theatrical works'),
  ('Science Fiction', 'Speculative fiction with scientific elements'),
  ('Fantasy', 'Imaginative and magical fiction'),
  ('Mystery', 'Mystery and detective stories'),
  ('Romance', 'Romantic fiction'),
  ('Thriller', 'Suspenseful and exciting stories'),
  ('Horror', 'Scary and supernatural stories'),
  ('Self-Help', 'Personal development and improvement'),
  ('Psychology', 'Psychological theories and studies'),
  ('Sociology', 'Social behavior and society studies'),
  ('Law', 'Legal texts and case studies'),
  ('Medicine', 'Medical science and healthcare'),
  ('Engineering', 'Engineering principles and applications'),
  ('Computer Science', 'Computer programming and technology'),
  ('Agriculture', 'Farming and agricultural science'),
  ('Environmental', 'Environmental science and ecology'),
  ('Astronomy', 'Space and celestial studies'),
  ('Geology', 'Earth science and geology'),
  ('Linguistics', 'Language studies and linguistics'),
  ('Anthropology', 'Human societies and cultures'),
  ('Archaeology', 'Study of human history through excavation');

-- Create storage bucket for books
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'books', 
  'books', 
  true, 
  104857600, -- 100MB limit
  ARRAY['application/pdf']
);

-- Storage policies for books bucket
CREATE POLICY "Anyone can view books" ON storage.objects
FOR SELECT USING (bucket_id = 'books');

CREATE POLICY "Authenticated users can upload books" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'books' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own book files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'books' 
  AND auth.uid() = owner
);

CREATE POLICY "Users can delete own book files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'books' 
  AND auth.uid() = owner
);

-- RLS Policies for genres (public read, admin write)
CREATE POLICY "Anyone can view genres" ON genres FOR SELECT USING (true);
CREATE POLICY "Admins can insert genres" ON genres FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true)
);
CREATE POLICY "Admins can update genres" ON genres FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true)
);
CREATE POLICY "Admins can delete genres" ON genres FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true)
);

-- RLS Policies for books
CREATE POLICY "Public can view approved books" ON books FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own books" ON books FOR SELECT USING (auth.uid() = uploaded_by);
CREATE POLICY "Admins can view all books" ON books FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true)
);

CREATE POLICY "Authenticated users can insert books" ON books FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND uploaded_by = auth.uid()
);

CREATE POLICY "Users can update their own books" ON books FOR UPDATE USING (
  auth.uid() = uploaded_by
);

CREATE POLICY "Admins can update any book" ON books FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true)
);

CREATE POLICY "Users can delete their own books" ON books FOR DELETE USING (
  auth.uid() = uploaded_by AND status = 'pending'
);

CREATE POLICY "Admins can delete any book" ON books FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true)
);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON user_profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.is_admin = true)
);

-- RLS Policies for book_downloads
CREATE POLICY "Anyone can insert downloads" ON book_downloads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all downloads" ON book_downloads FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true)
);

-- RLS Policies for book_views
CREATE POLICY "Anyone can insert views" ON book_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all views" ON book_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true)
);

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get book count by genre
CREATE OR REPLACE FUNCTION public.get_books_by_genre()
RETURNS TABLE(genre_id UUID, genre_name VARCHAR, book_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as genre_id,
    g.name as genre_name,
    COUNT(b.id) as book_count
  FROM genres g
  LEFT JOIN books b ON g.id = b.genre_id AND b.status = 'approved'
  GROUP BY g.id, g.name
  ORDER BY book_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search books
CREATE OR REPLACE FUNCTION public.search_books(search_term TEXT)
RETURNS TABLE(
  id UUID,
  title VARCHAR,
  author VARCHAR,
  description TEXT,
  file_url TEXT,
  genre_name VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.author,
    b.description,
    b.file_url,
    g.name as genre_name,
    b.created_at
  FROM books b
  LEFT JOIN genres g ON b.genre_id = g.id
  WHERE b.status = 'approved'
    AND (
      b.title ILIKE '%' || search_term || '%'
      OR b.author ILIKE '%' || search_term || '%'
      OR b.description ILIKE '%' || search_term || '%'
      OR g.name ILIKE '%' || search_term || '%'
    )
  ORDER BY 
    CASE 
      WHEN b.title ILIKE '%' || search_term || '%' THEN 1
      WHEN b.author ILIKE '%' || search_term || '%' THEN 2
      ELSE 3
    END,
    b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular books
CREATE OR REPLACE FUNCTION public.get_popular_books(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  title VARCHAR,
  author VARCHAR,
  file_url TEXT,
  genre_name VARCHAR,
  download_count BIGINT,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.author,
    b.file_url,
    g.name as genre_name,
    COUNT(DISTINCT bd.id) as download_count,
    COUNT(DISTINCT bv.id) as view_count
  FROM books b
  LEFT JOIN genres g ON b.genre_id = g.id
  LEFT JOIN book_downloads bd ON b.id = bd.book_id
  LEFT JOIN book_views bv ON b.id = bv.book_id
  WHERE b.status = 'approved'
  GROUP BY b.id, b.title, b.author, b.file_url, g.name
  ORDER BY (COUNT(DISTINCT bd.id) + COUNT(DISTINCT bv.id)) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample books for testing
INSERT INTO books (title, author, description, file_url, genre_id, status, file_size, file_name) VALUES
  ('Introduction to Physics', 'Dr. John Smith', 'A comprehensive introduction to classical physics', 'https://example.com/physics.pdf', (SELECT id FROM genres WHERE name = 'Physics'), 'approved', 2547890, 'physics_intro.pdf'),
  ('History of Ancient Civilizations', 'Prof. Sarah Johnson', 'Exploring ancient civilizations from Mesopotamia to Rome', 'https://example.com/history.pdf', (SELECT id FROM genres WHERE name = 'History'), 'approved', 1876543, 'ancient_history.pdf'),
  ('Data Structures and Algorithms', 'Michael Chen', 'Essential computer science concepts for programmers', 'https://example.com/algorithms.pdf', (SELECT id FROM genres WHERE name = 'Computer Science'), 'approved', 3456789, 'data_structures.pdf'),
  ('The Art of Fiction', 'Emily Watson', 'Mastering the craft of fictional writing', 'https://example.com/fiction.pdf', (SELECT id FROM genres WHERE name = 'Fiction'), 'approved', 1987654, 'fiction_art.pdf'),
  ('Business Fundamentals', 'Robert Williams', 'Core principles of modern business management', 'https://example.com/business.pdf', (SELECT id FROM genres WHERE name = 'Business'), 'approved', 2876543, 'business_fundamentals.pdf');
