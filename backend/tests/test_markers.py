from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestMarkerCRUD:
    """Test marker CRUD operations with ordering."""
    
    async def test_add_marker_to_route(self, auth_client):
        """Test adding a marker to a route."""
        client, headers = auth_client
        
        # Create route first
        route_data = {
            "title": "Route with Markers",
            "geometry": {
                "type": "LineString",
                "coordinates": [[-77.0, -12.0], [-77.1, -12.1]]
            }
        }
        route_resp = await client.post("/api/routes", json=route_data, headers=headers)
        route_id = route_resp.json()["id"]
        
        # Add marker
        marker_data = {
            "geometry": {
                "type": "Point",
                "coordinates": [-77.05, -12.05]
            },
            "label": "Rest Stop",
            "description": "Good place to rest",
            "icon_type": "rest"
        }
        
        response = await client.post(
            f"/api/routes/{route_id}/markers",
            json=marker_data,
            headers=headers
        )
        assert response.status_code == 201
        
        data = response.json()
        assert data["label"] == "Rest Stop"
        assert data["description"] == "Good place to rest"
        assert data["icon_type"] == "rest"
        assert data["geometry"]["type"] == "Point"
    
    async def test_marker_ordering(self, auth_client):
        """Test markers maintain proper ordering."""
        client, headers = auth_client
        
        # Create route
        route_data = {
            "title": "Ordered Markers",
            "geometry": {
                "type": "LineString",
                "coordinates": [[-77.0, -12.0], [-77.1, -12.1]]
            }
        }
        route_resp = await client.post("/api/routes", json=route_data, headers=headers)
        route_id = route_resp.json()["id"]
        
        # Add markers in sequence
        markers = [
            {"label": "First", "geometry": {"type": "Point", "coordinates": [-77.01, -12.01]}},
            {"label": "Second", "geometry": {"type": "Point", "coordinates": [-77.02, -12.02]}},
            {"label": "Third", "geometry": {"type": "Point", "coordinates": [-77.03, -12.03]}},
        ]
        
        for marker in markers:
            await client.post(f"/api/routes/{route_id}/markers", json=marker, headers=headers)
        
        # Get route and verify order
        response = await client.get(f"/api/routes/{route_id}", headers=headers)
        data = response.json()
        
        assert len(data["markers"]) == 3
        assert data["markers"][0]["label"] == "First"
        assert data["markers"][1]["label"] == "Second"
        assert data["markers"][2]["label"] == "Third"
    
    async def test_update_marker(self, auth_client):
        """Test updating a marker."""
        client, headers = auth_client
        
        # Create route and marker
        route_data = {
            "title": "Update Marker Test",
            "geometry": {
                "type": "LineString",
                "coordinates": [[-77.0, -12.0], [-77.1, -12.1]]
            }
        }
        route_resp = await client.post("/api/routes", json=route_data, headers=headers)
        route_id = route_resp.json()["id"]
        
        marker_data = {
            "geometry": {"type": "Point", "coordinates": [-77.05, -12.05]},
            "label": "Original Label"
        }
        marker_resp = await client.post(f"/api/routes/{route_id}/markers", json=marker_data, headers=headers)
        marker_id = marker_resp.json()["id"]
        
        # Update marker
        update = {"label": "Updated Label", "icon_type": "water"}
        response = await client.put(
            f"/api/routes/{route_id}/markers/{marker_id}",
            json=update,
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["label"] == "Updated Label"
        assert data["icon_type"] == "water"
    
    async def test_delete_marker(self, auth_client):
        """Test deleting a marker."""
        client, headers = auth_client
        
        # Create route and marker
        route_data = {
            "title": "Delete Marker Test",
            "geometry": {
                "type": "LineString",
                "coordinates": [[-77.0, -12.0], [-77.1, -12.1]]
            }
        }
        route_resp = await client.post("/api/routes", json=route_data, headers=headers)
        route_id = route_resp.json()["id"]
        
        marker_data = {
            "geometry": {"type": "Point", "coordinates": [-77.05, -12.05]},
            "label": "To Delete"
        }
        marker_resp = await client.post(f"/api/routes/{route_id}/markers", json=marker_data, headers=headers)
        marker_id = marker_resp.json()["id"]
        
        # Delete
        response = await client.delete(f"/api/routes/{route_id}/markers/{marker_id}", headers=headers)
        assert response.status_code == 204
        
        # Verify deleted via route detail
        route_detail = await client.get(f"/api/routes/{route_id}", headers=headers)
        markers = route_detail.json()["markers"]
        assert not any(m["id"] == marker_id for m in markers)


class TestMarkerGeometry:
    """Test marker geometry handling with PostGIS."""
    
    async def test_marker_returns_valid_geojson_point(self, auth_client):
        """Test markers return valid GeoJSON Point."""
        client, headers = auth_client
        
        # Create route
        route_data = {
            "title": "Marker GeoJSON Test",
            "geometry": {
                "type": "LineString",
                "coordinates": [[-77.0, -12.0], [-77.1, -12.1]]
            }
        }
        route_resp = await client.post("/api/routes", json=route_data, headers=headers)
        route_id = route_resp.json()["id"]
        
        # Add marker
        coordinates = [-77.0428, -12.0464]
        marker_data = {
            "geometry": {"type": "Point", "coordinates": coordinates},
            "label": "GeoJSON Test"
        }
        
        response = await client.post(f"/api/routes/{route_id}/markers", json=marker_data, headers=headers)
        data = response.json()
        
        assert data["geometry"]["type"] == "Point"
        assert len(data["geometry"]["coordinates"]) == 2
        assert abs(data["geometry"]["coordinates"][0] - coordinates[0]) < 0.0001
        assert abs(data["geometry"]["coordinates"][1] - coordinates[1]) < 0.0001
