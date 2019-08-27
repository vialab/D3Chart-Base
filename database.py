import sqlalchemy
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import relationship
from sqlalchemy.orm import deferred
from sqlalchemy.orm import Session, aliased
from sqlalchemy.ext.declarative import declarative_base

# from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, backref

from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.orderinglist import ordering_list
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import scoped_session

from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method

from sqlalchemy import MetaData, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

metadata = MetaData()
Base = declarative_base(metadata=metadata)

class Job(Base):
    __tablename__ = 'job'

    job_id = Column(Integer, primary_key=True)
    description = Column(String(256))

    def __init__(self, description):
        self.description = description