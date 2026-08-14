<?php

namespace Workdo\Assets\Database\Seeders;

use Illuminate\Database\Seeder;
use Workdo\Assets\Models\AssetLocation;

class DemoAssetLocationSeeder extends Seeder
{
    public function run($userId): void
    {
        if (AssetLocation::where('created_by', $userId)->exists()) {
            return;
        }
        
        $locations = [
            ['name' => 'Main Office Building', 'code' => 'MOB-001', 'type' => 'building', 'address' => '123 Business Avenue', 'city' => 'New York', 'state' => 'NY', 'country' => 'USA', 'postal_code' => '10001', 'contact_person' => 'John Manager', 'contact_phone' => '+12125551001', 'contact_email' => 'john@company.com', 'is_active' => true],
            ['name' => 'Warehouse District A', 'code' => 'WH-A-001', 'type' => 'warehouse', 'address' => '456 Industrial Road', 'city' => 'Los Angeles', 'state' => 'CA', 'country' => 'USA', 'postal_code' => '90001', 'contact_person' => 'Sarah Logistics', 'contact_phone' => '+13105551002', 'contact_email' => 'sarah@company.com', 'is_active' => true],
            ['name' => 'Tech Campus Site', 'code' => 'TECH-001', 'type' => 'site', 'address' => '789 Innovation Drive', 'city' => 'San Francisco', 'state' => 'CA', 'country' => 'USA', 'postal_code' => '94101', 'contact_person' => 'Mike Tech', 'contact_phone' => '+14155551003', 'contact_email' => 'mike@company.com', 'is_active' => true],
            ['name' => 'Floor 2 - Administration', 'code' => 'FL2-ADM-001', 'type' => 'floor', 'address' => '123 Business Avenue', 'city' => 'New York', 'state' => 'NY', 'country' => 'USA', 'postal_code' => '10001', 'contact_person' => 'Lisa Admin', 'contact_phone' => '+12125551004', 'contact_email' => 'lisa@company.com', 'is_active' => true],
            ['name' => 'Floor 3 - IT Department', 'code' => 'FL3-IT-001', 'type' => 'floor', 'address' => '123 Business Avenue', 'city' => 'New York', 'state' => 'NY', 'country' => 'USA', 'postal_code' => '10001', 'contact_person' => 'David IT', 'contact_phone' => '+12125551005', 'contact_email' => 'david@company.com', 'is_active' => true],
            ['name' => 'Conference Room A', 'code' => 'CONF-A-001', 'type' => 'room', 'address' => '123 Business Avenue', 'city' => 'New York', 'state' => 'NY', 'country' => 'USA', 'postal_code' => '10001', 'contact_person' => 'Emma Facilities', 'contact_phone' => '+12125551006', 'contact_email' => 'emma@company.com', 'is_active' => true],
            ['name' => 'Server Room', 'code' => 'SRV-001', 'type' => 'room', 'address' => '123 Business Avenue', 'city' => 'New York', 'state' => 'NY', 'country' => 'USA', 'postal_code' => '10001', 'contact_person' => 'Tom Network', 'contact_phone' => '+12125551007', 'contact_email' => 'tom@company.com', 'is_active' => true],
            ['name' => 'Warehouse District B', 'code' => 'WH-B-001', 'type' => 'warehouse', 'address' => '321 Storage Lane', 'city' => 'Chicago', 'state' => 'IL', 'country' => 'USA', 'postal_code' => '60601', 'contact_person' => 'Rachel Storage', 'contact_phone' => '+13125551008', 'contact_email' => 'rachel@company.com', 'is_active' => true],
            ['name' => 'Production Floor', 'code' => 'PROD-FL-001', 'type' => 'floor', 'address' => '456 Industrial Road', 'city' => 'Los Angeles', 'state' => 'CA', 'country' => 'USA', 'postal_code' => '90001', 'contact_person' => 'James Production', 'contact_phone' => '+13105551009', 'contact_email' => 'james@company.com', 'is_active' => true],
            ['name' => 'Regional Office Dallas', 'code' => 'REG-DAL-001', 'type' => 'building', 'address' => '555 Commerce Street', 'city' => 'Dallas', 'state' => 'TX', 'country' => 'USA', 'postal_code' => '75201', 'contact_person' => 'Nancy Regional', 'contact_phone' => '+12145551010', 'contact_email' => 'nancy@company.com', 'is_active' => true],
        ];

        foreach ($locations as $location) {
            AssetLocation::create(array_merge($location, [
                'creator_id' => $userId,
                'created_by' => $userId,
            ]));
        }
    }
}
