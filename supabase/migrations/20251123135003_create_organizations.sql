-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT,
    size TEXT,
    billing_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(org_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Policies for organizations
CREATE POLICY "Users can view organizations they belong to" 
    ON public.organizations FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE organization_members.org_id = organizations.id 
        AND organization_members.user_id = auth.uid()
    ));

CREATE POLICY "Owners can update their organization" 
    ON public.organizations FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE organization_members.org_id = organizations.id 
        AND organization_members.user_id = auth.uid()
        AND organization_members.role = 'owner'
    ));

-- Policies for organization_members
CREATE POLICY "Users can view members of their organization" 
    ON public.organization_members FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.organization_members as om
        WHERE om.org_id = organization_members.org_id 
        AND om.user_id = auth.uid()
    ));

CREATE POLICY "Admins/Owners can add members" 
    ON public.organization_members FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.organization_members as om
        WHERE om.org_id = organization_members.org_id 
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    ));

CREATE POLICY "Admins/Owners can remove members" 
    ON public.organization_members FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM public.organization_members as om
        WHERE om.org_id = organization_members.org_id 
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    ));

-- Function to create an organization and add the creator as owner
CREATE OR REPLACE FUNCTION public.create_organization(name TEXT, industry TEXT, size TEXT, billing_email TEXT)
RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
BEGIN
    INSERT INTO public.organizations (name, industry, size, billing_email)
    VALUES (name, industry, size, billing_email)
    RETURNING id INTO new_org_id;

    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (new_org_id, auth.uid(), 'owner');

    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
