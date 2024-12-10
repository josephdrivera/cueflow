-- Create Shows table with foreign key to Users
CREATE TABLE Shows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft',
    is_published BOOLEAN DEFAULT false,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE
);
