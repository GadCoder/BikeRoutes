from __future__ import annotations

import uuid
import pytest
from httpx import AsyncClient


class TestRouteCRUD:
    """Test route CRUD operations with PostGIS geometry."""
    
    async def test_create_route(self, auth_client):
        """Test creating a route with GeoJSON geometry."""
        client, headers = auth_client
        
        route_data = {
            "title": "Test Route",
            "description": "A test cycling route",
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [-77.0428, -12.0464],
                    [-77.0430, -12.0470],
                    [-77.0440, -12.0480]
                ]
            }
        }
        
        response = await client.post("/api/routes", json=route_data, headers=headers)
        assert response.status_code == 201
        
        data = response.json()
        assert data["title"] == "Test Route"
        assert data["description"] == "A test cycling route"
        assert data["geometry"]["type"] == "LineString"
        assert len(data["geometry"]["coordinates"]) == 3
        assert "distance_km" in data
        assert "id" in data
    
    async def test_list_routes(self, auth_client):
        """Test listing routes returns only owned routes."""
        client, headers = auth_client
        
        # Create a route first
        route_data = {
            "title": "My Route",
            "geometry": {
                "type": "LineString",
                "coordinates": [[-77.0, -12.0], [-77.1, -12.1]]
            }
        }
        await client.post("/api/routes", json=route_data, headers=headers)
        
        # List routes
        response = await client.get("/api/routes", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["title"] == "My Route"
    
    async def test_get_route_detail(self, auth_client):
        """Test getting route details with markers."""
        client, headers = auth_client
        
        # Create route
        route_data = {
            "title": "Detail Test Route",
            "geometry": {
                "type": "LineString",
                "coordinates": [[-77.0, -12.0], [-77.1, -12.1]]
            }
        }
        create_resp = await client.post("/api/routes", json=route_data, headers=headers)
        route_id = create_resp.json()["id"]
        
        # Get detail
        response = await client.get(f"/api/routes/{route_id}", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == "Detail Test Route"
        assert "markers" in data
        assert isinstance(data["markers"], list)
    
    async def test_update_route(self, auth_client):
        """Test updating a route."""
        client, headers = auth_client
        
        # Create route
        route_data = {
            "title": "Original Title",
            "geometry": {
                "type": "LineString",
                "coordinates": [[-77.0, -12.0], [-77.1, -12.1]]
            }
        }
        create_resp = await client.post("/api/routes", json=route_data, headers=headers)
        route_id = create_resp.json()["id"]
        
        # Update
        update_data = {"title": "Updated Title", "description": "New description"}
        response = await client.put(f"/api/routes/{route_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["description"] == "New description"
    
    async def test_delete_route(self, auth_client):
        """Test deleting a route."""
        client, headers = auth_client
        
        # Create route
        route_data = {
            "title": "To Delete",
            "geometry": {
                "type": "LineString",
                "coordinates": [[-77.0, -12.0], [-77.1, -12.1]]
            }
        }
        create_resp = await client.post("/api/routes", json=route_data, headers=headers)
        route_id = create_resp.json()["id"]
        
        # Delete
        response = await client.delete(f"/api/routes/{route_id}", headers=headers)
        assert response.status_code == 204
        
        # Verify deleted
        get_resp = await client.get(f"/api/routes/{route_id}", headers=headers)
        assert get_resp.status_code == 404


class TestRouteOwnership:
    """Test route ownership enforcement."""
    
    async def test_cannot_access_other_users_route(self, auth_client, client):
        """Test that users cannot access routes they don't own."""
        client1, headers1 = auth_client
        
        # Create route as user 1
        route_data = {
            "title": "Private Route",
            "geometry": {
                "type": "LineString",
                "coordinates": [[-77.0, -12.0], [-77.1, -12.1]]
            }
        }
        create_resp = await client1.post("/api/routes", json=route_data, headers=headers1)
        route_id = create_resp.json()["id"]
        
        # Create user 2
        resp = await client.post(
            "/api/auth/register",
            json={"email": f"other_{uuid.uuid4()}@example.com", "password": "TestPassword123!"}
        )
        headers2 = {"Authorization": f"Bearer {resp.json()['access_token']}"}
        
        # User 2 should not see route in list
        list_resp = await client.get("/api/routes", headers=headers2)
        route_ids = [r["id"] for r in list_resp.json()]
        assert route_id not in route_ids
        
        # User 2 should get 404 when trying to access directly
        get_resp = await client.get(f"/api/routes/{route_id}", headers=headers2)
        assert get_resp.status_code == 404


class TestRouteSharing:
    """Test route sharing with public/private and share tokens."""
    
    async def test_public_route_accessible_without_auth(self, auth_client, client):
        """Test public routes can be accessed without authentication."""
        client1, headers1 = auth_client
        
        # Create public route
        route_data = {
            "title": "Public Route",
            "is_public": True,
            "geometry": {
                "type": "LineString",
                "coordinates": [[-77.0, -12.0], [-77.1, -12.1]]
            }
        }
        create_resp = await client1.post("/api/routes", json=route_data, headers=headers1)
        route_id = create_resp.json()["id"]
        
        # Should be accessible without auth
        response = await client.get(f"/api/routes/{route_id}")
        assert response.status_code == 200
        assert response.json()["title"] == "Public Route"
    
    async def test_private_route_requires_auth(self, client):
        """Test private routes require authentication."""
        response = await client.get(f"/api/routes/{uuid.uuid4()}")
        assert response.status_code == 401


class TestRouteGeoJSON:
    """Test GeoJSON serialization and spatial data handling."""
    
    async def test_route_returns_valid_geojson(self, auth_client):
        """Test that routes return valid GeoJSON."""
        client, headers = auth_client
        
        coordinates = [
            [-77.0428, -12.0464],
            [-77.0430, -12.0470],
            [-77.0440, -12.0480]
        ]
        
        route_data = {
            "title": "GeoJSON Test",
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates
            }
        }
        
        response = await client.post("/api/routes", json=route_data, headers=headers)
        data = response.json()
        
        assert data["geometry"]["type"] == "LineString"
        assert len(data["geometry"]["coordinates"]) == len(coordinates)
        
        # Verify coordinates match (allowing for float precision)
        for i, coord in enumerate(data["geometry"]["coordinates"]):
            assert abs(coord[0] - coordinates[i][0]) < 0.0001
            assert abs(coord[1] - coordinates[i][1]) < 0.0001
    
    async def test_distance_calculation(self, auth_client):
        """Test that route distance is calculated correctly."""
        client, headers = auth_client
        
        # Create route with known distance
        route_data = {
            "title": "Distance Test",
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [-77.0428, -12.0464],  # Lima center
                    [-77.0430, -12.0470]   # ~100m away
                ]
            }
        }
        
        response = await client.post("/api/routes", json=route_data, headers=headers)
        data = response.json()
        
        # Distance should be positive and reasonable (around 0.1 km)
        assert data["distance_km"] > 0
        assert data["distance_km"] < 1.0
