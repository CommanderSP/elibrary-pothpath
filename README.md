# Database

```sql

CREATE TABLE public.books (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title character varying NOT NULL CHECK (char_length(title::text) >= 1),
  author character varying NOT NULL CHECK (char_length(author::text) >= 1),
  description text,
  file_url text,
  genre_id uuid,
  isbn character varying,
  publication_date date,
  language character varying DEFAULT 'en'::character varying,
  page_count integer CHECK (page_count > 0 OR page_count IS NULL),
  file_size_bytes bigint CHECK (file_size_bytes > 0 OR file_size_bytes IS NULL),
  file_type character varying,
  cover_image_url text,
  reading_level character varying,
  tags ARRAY,
  status character varying DEFAULT 'approved'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'archived'::character varying]::text[])),
  is_featured boolean DEFAULT false,
  is_public boolean DEFAULT true,
  download_count integer DEFAULT 0 CHECK (download_count >= 0),
  average_rating numeric CHECK (average_rating >= 0::numeric AND average_rating <= 5::numeric),
  rating_count integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  published_at timestamp without time zone,
  created_by uuid,
  updated_by uuid,
  approved_by uuid,
  approved_at timestamp without time zone,
  version integer DEFAULT 1,
  search_vector tsvector,
  CONSTRAINT books_pkey PRIMARY KEY (id),
  CONSTRAINT books_genre_fkey FOREIGN KEY (genre_id) REFERENCES public.genres(id)
);
CREATE TABLE public.genres (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE CHECK (char_length(name::text) >= 1),
  description text,
  slug character varying UNIQUE,
  color_code character varying CHECK (color_code::text ~ '^#[0-9A-Fa-f]{6}$'::text OR color_code IS NULL),
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  version integer DEFAULT 1,
  CONSTRAINT genres_pkey PRIMARY KEY (id)
);
```

## claude Gen

```sql
-- Books Database Schema with Enhanced Metadata
-- This schema eliminates the many-to-many relationship and adds comprehensive metadata

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Genres table with metadata
CREATE TABLE public.genres (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying(100) NOT NULL UNIQUE,
    description text,
    slug character varying(120) UNIQUE,
    color_code character varying(7), -- For UI theming (hex color)
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    
    -- Metadata fields
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid, -- Reference to user who created this genre
    updated_by uuid, -- Reference to user who last updated this genre
    version integer DEFAULT 1, -- For optimistic locking
    
    CONSTRAINT genres_pkey PRIMARY KEY (id),
    CONSTRAINT genres_name_length CHECK (char_length(name) >= 1),
    CONSTRAINT genres_color_format CHECK (color_code ~ '^#[0-9A-Fa-f]{6}$' OR color_code IS NULL)
);

-- Books table with enhanced metadata (simplified relationship)
CREATE TABLE public.books (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    description text,
    file_url text,
    
    -- Single genre relationship (one-to-many instead of many-to-many)
    genre_id uuid,
    
    -- Additional book metadata
    isbn character varying(20),
    publication_date date,
    language character varying(10) DEFAULT 'en',
    page_count integer,
    file_size_bytes bigint,
    file_type character varying(10), -- pdf, epub, mobi, etc.
    cover_image_url text,
    reading_level character varying(20), -- beginner, intermediate, advanced
    tags text[], -- Array of tags for flexible categorization
    
    -- Status and visibility
    status character varying(20) DEFAULT 'approved',
    is_featured boolean DEFAULT false,
    is_public boolean DEFAULT true,
    download_count integer DEFAULT 0,
    average_rating decimal(3,2), -- 0.00 to 5.00
    rating_count integer DEFAULT 0,
    
    -- Metadata fields
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    published_at timestamp without time zone,
    created_by uuid, -- Reference to user who added this book
    updated_by uuid, -- Reference to user who last updated this book
    approved_by uuid, -- Reference to user who approved this book
    approved_at timestamp without time zone,
    version integer DEFAULT 1, -- For optimistic locking
    
    -- Search and indexing
    search_vector tsvector, -- For full-text search
    
    CONSTRAINT books_pkey PRIMARY KEY (id),
    CONSTRAINT books_genre_fkey FOREIGN KEY (genre_id) REFERENCES public.genres(id) ON DELETE SET NULL,
    CONSTRAINT books_title_length CHECK (char_length(title) >= 1),
    CONSTRAINT books_author_length CHECK (char_length(author) >= 1),
    CONSTRAINT books_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
    CONSTRAINT books_rating_range CHECK (average_rating >= 0 AND average_rating <= 5),
    CONSTRAINT books_page_count_positive CHECK (page_count > 0 OR page_count IS NULL),
    CONSTRAINT books_file_size_positive CHECK (file_size_bytes > 0 OR file_size_bytes IS NULL),
    CONSTRAINT books_download_count_positive CHECK (download_count >= 0)
);

-- Create indexes for better performance
CREATE INDEX idx_books_genre_id ON public.books(genre_id);
CREATE INDEX idx_books_status ON public.books(status);
CREATE INDEX idx_books_author ON public.books(author);
CREATE INDEX idx_books_created_at ON public.books(created_at DESC);
CREATE INDEX idx_books_is_featured ON public.books(is_featured) WHERE is_featured = true;
CREATE INDEX idx_books_is_public ON public.books(is_public) WHERE is_public = true;
CREATE INDEX idx_books_publication_date ON public.books(publication_date DESC);
CREATE INDEX idx_books_tags ON public.books USING GIN(tags); -- GIN index for array operations
CREATE INDEX idx_books_search_vector ON public.books USING GIN(search_vector); -- For full-text search

CREATE INDEX idx_genres_slug ON public.genres(slug);
CREATE INDEX idx_genres_is_active ON public.genres(is_active) WHERE is_active = true;
CREATE INDEX idx_genres_sort_order ON public.genres(sort_order);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update timestamps and version
CREATE TRIGGER update_books_updated_at 
    BEFORE UPDATE ON public.books 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_genres_updated_at 
    BEFORE UPDATE ON public.genres 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update search vector for full-text search
CREATE OR REPLACE FUNCTION update_books_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.author, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update search vector
CREATE TRIGGER update_books_search_vector_trigger
    BEFORE INSERT OR UPDATE ON public.books
    FOR EACH ROW
    EXECUTE FUNCTION update_books_search_vector();

-- Sample data insertion (optional)
-- Insert some sample genres
INSERT INTO public.genres (name, description, slug, color_code) VALUES 
    ('Fiction', 'Fictional literature and novels', 'fiction', '#3B82F6'),
    ('Non-Fiction', 'Factual and educational content', 'non-fiction', '#10B981'),
    ('Science', 'Scientific texts and research', 'science', '#8B5CF6'),
    ('History', 'Historical books and documentaries', 'history', '#F59E0B'),
    ('Technology', 'Technical and programming books', 'technology', '#EF4444');

-- Note: This schema provides several advantages:
-- 1. Eliminates the complexity of many-to-many relationships
-- 2. Uses tags array for flexible categorization beyond single genre
-- 3. Includes comprehensive metadata for better book management
-- 4. Provides search capabilities with full-text search
-- 5. Includes proper indexing for performance
-- 6. Has audit trail with created_by, updated_by fields
-- 7. Version control for optimistic locking
-- 8. Flexible status management and visibility controls
```
