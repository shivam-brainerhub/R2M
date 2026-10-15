from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class HeroContentSchema(BaseModel):
    headline_part1: str = Field(default="Healthcare", validation_alias="headlinePart1")
    headline_part2: str = Field(default="without", validation_alias="headlinePart2")
    headline_accent: str = Field(default="limits.", validation_alias="headlineAccent")
    subheading: str = Field(
        default="Explore SA Healthcare's growing digital healthcare catalogue. Search products, brochures and technical specifications from trusted global manufacturers."
    )
    show_search_bar: bool = Field(default=True, validation_alias="showSearchBar")
    search_placeholder: Optional[str] = Field(
        default="Search by product, model number, manufacturer, brochure or technical specification...",
        validation_alias="searchPlaceholder",
    )
    popular_searches: List[str] = Field(
        default=[
            "Patient Monitor",
            "Hospital Bed",
            "ECG",
            "Pulse Oximeter",
            "Infusion Pump",
            "Defibrillator",
            "Ultrasound",
        ],
        validation_alias="popularSearches",
    )
    badge_title: Optional[str] = Field(
        default="TRUST • ACCESS • INNOVATION • IMPACT", validation_alias="badgeTitle"
    )
    badge_tagline: Optional[str] = Field(
        default="A HEALTHIER TOMORROW TOGETHER.", validation_alias="badgeTagline"
    )

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class CompanyContentSchema(BaseModel):
    company_name: str = Field(default="SA Healthcare", validation_alias="companyName")
    phone: str = Field(default="+27 11 555 0100")
    toll_free: Optional[str] = Field(default="0800 123 456", validation_alias="tollFree")
    email: str = Field(default="info@sahealthcare.com")
    sales_email: Optional[str] = Field(default="quotes@sahealthcare.com", validation_alias="salesEmail")
    physical_address: str = Field(
        default="15 Medical Boulevard, Sandton, Johannesburg, 2196, South Africa",
        validation_alias="physicalAddress",
    )
    hours: str = Field(default="Monday – Friday: 08:00 – 17:00 (SAST)")

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class WhyUsItemSchema(BaseModel):
    id: Optional[str] = None
    icon: str = "language"
    title: str
    description: str

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class WhyUsContentSchema(BaseModel):
    section_tag: Optional[str] = Field(default="WHY SA HEALTHCARE", validation_alias="sectionTag")
    title: Optional[str] = Field(default="Why choose SA Healthcare")
    items: List[WhyUsItemSchema] = Field(
        default=[
            WhyUsItemSchema(
                id="1",
                icon="language",
                title="Trusted Global Manufacturers",
                description="A comprehensive range of products from leading brands worldwide.",
            ),
            WhyUsItemSchema(
                id="2",
                icon="description",
                title="Brochures & Technical Information",
                description="Every product includes brochures and technical specifications.",
            ),
            WhyUsItemSchema(
                id="3",
                icon="chat",
                title="Request a Quote",
                description="Receive personalised assistance from our healthcare specialists.",
            ),
        ]
    )

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class CTAContentSchema(BaseModel):
    heading: str = Field(default="Need a quotation or product advice?")
    subheading: str = Field(
        default="Speak to our team for expert guidance and tailored solutions for your facility."
    )
    button_text: Optional[str] = Field(default="Request a Quote", validation_alias="buttonText")
    button_link: Optional[str] = Field(default="/contact", validation_alias="buttonLink")
    phone: Optional[str] = Field(default="+27 11 555 0100")
    email: Optional[str] = Field(default="info@sahealthcare.com")

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class LegalSectionItemSchema(BaseModel):
    id: Optional[str] = None
    heading: Optional[str] = None
    content: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class LegalContentSchema(BaseModel):
    title: str = Field(default="Legal Document")
    subtitle: Optional[str] = Field(default="")
    last_updated: Optional[str] = Field(default="October 2026", validation_alias="lastUpdated")
    content: str = Field(default="")
    sections: Optional[List[LegalSectionItemSchema]] = Field(default=None)

    model_config = ConfigDict(populate_by_name=True, extra="allow")


class SiteContentItemResponse(BaseModel):
    id: int
    key: str
    title: Optional[str] = None
    content: Dict[str, Any]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SiteContentUpdate(BaseModel):
    title: Optional[str] = None
    content: Dict[str, Any]


class SiteContentBatchUpdate(BaseModel):
    sections: Dict[str, Dict[str, Any]]


class AllSiteContentResponse(BaseModel):
    hero: Dict[str, Any]
    company: Dict[str, Any]
    why_us: Optional[Dict[str, Any]] = None
    cta: Optional[Dict[str, Any]] = None
    privacy_policy: Optional[Dict[str, Any]] = None
    terms_of_use: Optional[Dict[str, Any]] = None
    sections: Optional[Dict[str, Dict[str, Any]]] = None

    model_config = ConfigDict(extra="allow")
