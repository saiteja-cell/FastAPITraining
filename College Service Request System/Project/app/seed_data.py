from datetime import datetime
from pymongo import MongoClient

from app.config import settings


client = MongoClient(settings.MONGO_URI)
db = client[settings.MONGO_DB_NAME]


def seed_users():
    users = [
        {
            "id": "student001",
            "name": "Rahul Student",
            "email": "student@college.com",
            "password": "student123",
            "role": "student",
            "created_at": datetime.utcnow()
        },
        {
            "id": "faculty001",
            "name": "Dr. Faculty",
            "email": "faculty@college.com",
            "password": "faculty123",
            "role": "faculty",
            "created_at": datetime.utcnow()
        },
        {
            "id": "staff001",
            "name": "Service Staff",
            "email": "staff@college.com",
            "password": "staff123",
            "role": "service_staff",
            "created_at": datetime.utcnow()
        },
        {
            "id": "lead001",
            "name": "Service Lead",
            "email": "lead@college.com",
            "password": "lead123",
            "role": "service_lead",
            "created_at": datetime.utcnow()
        },
        {
            "id": "admin001",
            "name": "College Admin",
            "email": "admin@college.com",
            "password": "admin123",
            "role": "admin",
            "created_at": datetime.utcnow()
        }
    ]

    db["users"].delete_many({})

    if users:
        db["users"].insert_many(users)

    print("Users seeded successfully.")


def seed_categories():
    categories = [
        {
            "id": "cat001",
            "name": "BONAFIDE_CERTIFICATE",
            "description": "Requests for bonafide certificates.",
            "created_at": datetime.utcnow()
        },
        {
            "id": "cat002",
            "name": "ID_CARD",
            "description": "Requests related to college ID cards.",
            "created_at": datetime.utcnow()
        },
        {
            "id": "cat003",
            "name": "HOSTEL",
            "description": "Hostel-related service requests.",
            "created_at": datetime.utcnow()
        },
        {
            "id": "cat004",
            "name": "TRANSPORT",
            "description": "College transport and bus-related requests.",
            "created_at": datetime.utcnow()
        },
        {
            "id": "cat005",
            "name": "LIBRARY",
            "description": "Library-related service requests.",
            "created_at": datetime.utcnow()
        },
        {
            "id": "cat006",
            "name": "IT_SUPPORT",
            "description": "IT, computer, network and technical support requests.",
            "created_at": datetime.utcnow()
        }
    ]

    db["categories"].delete_many({})

    if categories:
        db["categories"].insert_many(categories)

    print("Categories seeded successfully.")


def seed_service_requests():
    requests = [
        {
            "id": "req001",
            "title": "Bonafide Certificate Required",
            "description": "Student requires a bonafide certificate.",
            "category_id": "cat001",
            "created_by": "student001",
            "status": "new",
            "assigned_to": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": "req002",
            "title": "College Wi-Fi Issue",
            "description": "Unable to connect to the college Wi-Fi.",
            "category_id": "cat006",
            "created_by": "student001",
            "status": "assigned",
            "assigned_to": "staff001",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]

    db["service_requests"].delete_many({})

    if requests:
        db["service_requests"].insert_many(requests)

    print("Service requests seeded successfully.")


def seed_comments():
    comments = [
        {
            "id": "comment001",
            "request_id": "req001",
            "user_id": "student001",
            "comment": "I need the certificate for an official purpose.",
            "created_at": datetime.utcnow()
        },
        {
            "id": "comment002",
            "request_id": "req002",
            "user_id": "staff001",
            "comment": "We are checking the Wi-Fi connection.",
            "created_at": datetime.utcnow()
        }
    ]

    db["comments"].delete_many({})

    if comments:
        db["comments"].insert_many(comments)

    print("Comments seeded successfully.")


def seed_attachments():
    attachments = [
        {
            "id": "attachment001",
            "request_id": "req001",
            "uploaded_by": "student001",
            "file_name": "student_document.pdf",
            "file_path": "uploads/student_document.pdf",
            "created_at": datetime.utcnow()
        }
    ]

    db["attachments"].delete_many({})

    if attachments:
        db["attachments"].insert_many(attachments)

    print("Attachments seeded successfully.")


def seed_audit_logs():
    audit_logs = [
        {
            "id": "audit001",
            "request_id": "req001",
            "user_id": "student001",
            "action": "REQUEST_CREATED",
            "old_value": None,
            "new_value": "new",
            "created_at": datetime.utcnow()
        },
        {
            "id": "audit002",
            "request_id": "req002",
            "user_id": "lead001",
            "action": "REQUEST_ASSIGNED",
            "old_value": None,
            "new_value": "staff001",
            "created_at": datetime.utcnow()
        }
    ]

    db["audit_logs"].delete_many({})

    if audit_logs:
        db["audit_logs"].insert_many(audit_logs)

    print("Audit logs seeded successfully.")


def seed_all():
    seed_users()
    seed_categories()
    seed_service_requests()
    seed_comments()
    seed_attachments()
    seed_audit_logs()

    print("College Service Request System seed completed.")


if __name__ == "__main__":
    seed_all()