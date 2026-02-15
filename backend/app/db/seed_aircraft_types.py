"""
Скрипт для заполнения справочника типов воздушных судов.

Заполняет справочник популярными типами ВС согласно требованиям ИКАО.
"""

from app.db.session import SessionLocal
from app.models.aircraft_type import AircraftType


def seed_aircraft_types():
    """Заполнить справочник типами воздушных судов."""
    db = SessionLocal()
    
    # Популярные типы воздушных судов
    aircraft_types = [
        # Boeing
        {"manufacturer": "Boeing", "model": "737-800"},
        {"manufacturer": "Boeing", "model": "737-900"},
        {"manufacturer": "Boeing", "model": "737 MAX 8"},
        {"manufacturer": "Boeing", "model": "777-300ER"},
        {"manufacturer": "Boeing", "model": "787-8 Dreamliner"},
        {"manufacturer": "Boeing", "model": "787-9 Dreamliner"},
        
        # Airbus
        {"manufacturer": "Airbus", "model": "A320"},
        {"manufacturer": "Airbus", "model": "A320neo"},
        {"manufacturer": "Airbus", "model": "A321"},
        {"manufacturer": "Airbus", "model": "A321neo"},
        {"manufacturer": "Airbus", "model": "A330-300"},
        {"manufacturer": "Airbus", "model": "A350-900"},
        {"manufacturer": "Airbus", "model": "A350-1000"},
        
        # Sukhoi Superjet
        {"manufacturer": "Sukhoi", "model": "Superjet 100"},
        {"manufacturer": "Sukhoi", "model": "Superjet 100-95"},
        {"manufacturer": "Sukhoi", "model": "Superjet 100-95LR"},
        
        # Иркут МС-21
        {"manufacturer": "Иркут", "model": "МС-21-300"},
        {"manufacturer": "Иркут", "model": "МС-21-310"},
        
        # Bombardier
        {"manufacturer": "Bombardier", "model": "CRJ-900"},
        {"manufacturer": "Bombardier", "model": "CRJ-1000"},
        
        # Embraer
        {"manufacturer": "Embraer", "model": "E-170"},
        {"manufacturer": "Embraer", "model": "E-175"},
        {"manufacturer": "Embraer", "model": "E-190"},
        {"manufacturer": "Embraer", "model": "E-195"},
        
        # ATR
        {"manufacturer": "ATR", "model": "72-600"},
        {"manufacturer": "ATR", "model": "42-600"},
        
        # Антонов
        {"manufacturer": "Антонов", "model": "Ан-148"},
        {"manufacturer": "Антонов", "model": "Ан-158"},
        
        # Ильюшин
        {"manufacturer": "Ильюшин", "model": "Ил-96-300"},
        {"manufacturer": "Ильюшин", "model": "Ил-96-400"},
        {"manufacturer": "Ильюшин", "model": "Ил-114-300"},
        
        # Ту
        {"manufacturer": "Туполев", "model": "Ту-204"},
        {"manufacturer": "Туполев", "model": "Ту-214"},
        {"manufacturer": "Туполев", "model": "Ту-334"},
        # Вертолёты
        {"manufacturer": "Миль", "model": "Ми-8"},
        {"manufacturer": "Миль", "model": "Ми-26"},
        {"manufacturer": "Миль", "model": "Ми-171"},
        {"manufacturer": "Камов", "model": "Ка-32"},
        {"manufacturer": "Камов", "model": "Ка-226"},
        {"manufacturer": "Казанский вертолетный завод", "model": "Ансат"},
    ]
    
    created_count = 0
    skipped_count = 0
    
    try:
        for at_data in aircraft_types:
            # Проверяем, существует ли уже такой тип
            existing = db.query(AircraftType).filter(
                AircraftType.manufacturer == at_data["manufacturer"],
                AircraftType.model == at_data["model"]
            ).first()
            
            if existing:
                skipped_count += 1
                continue
            
            # Создаем новый тип
            at = AircraftType(**at_data)
            db.add(at)
            created_count += 1
        
        db.commit()
        print(f"✅ Создано типов ВС: {created_count}")
        print(f"⏭️  Пропущено (уже существуют): {skipped_count}")
        print(f"📊 Всего в справочнике: {db.query(AircraftType).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка при заполнении справочника: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_aircraft_types()
