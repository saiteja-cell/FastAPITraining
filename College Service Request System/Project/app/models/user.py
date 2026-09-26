from datetime import datetime


class UserModel:
    collection_name = "users"

    @staticmethod
    def create_document(
        user_id: str,
        name: str,
        email: str,
        password: str,
        role: str,
        created_at: datetime
    ):
        return {
            "id": user_id,
            "name": name,
            "email": email,
            "password": password,
            "role": role,
            "created_at": created_at
        }